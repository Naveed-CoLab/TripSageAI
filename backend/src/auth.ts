import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "trip-planner-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // We'll create the strategy dynamically on each request 
    // So we always have the correct callback URL
    
    // Just log the configuration status
    console.log("Google OAuth is configured with CLIENT_ID and CLIENT_SECRET");
    console.log("Callback URL will be determined from each request");
  } else {
    console.warn("Google authentication is not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set.");
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request received:", req.body);
      const { username, email, password, firstName, lastName } = req.body;
      
      if (!username || !email || !password) {
        console.log("Missing required fields");
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Username already exists:", username);
        return res.status(400).json({ message: "Username already exists" });
      }

      console.log("Creating user:", username);
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        firstName,
        lastName
      });
      console.log("User created successfully with ID:", user.id);

      // Remove password from the response
      const { password: _, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        console.log("User logged in after registration");
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "An error occurred during registration" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
  
  // Route to check OAuth configuration
  app.get("/api/auth/check", (req, res) => {
    const clientID = process.env.GOOGLE_CLIENT_ID ? "Set (length: " + process.env.GOOGLE_CLIENT_ID.length + ")" : "Not set";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? "Set (length: " + process.env.GOOGLE_CLIENT_SECRET.length + ")" : "Not set";
    
    // Generate dynamic callback URL based on the current request
    const host = req.headers.host || (process.env.REPL_SLUG ? process.env.REPL_SLUG + ".id.repl.co" : "workspace.id.repl.co");
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const dynamicCallbackURL = `${protocol}://${host}/api/auth/google/callback`;
    
    res.json({
      googleAuth: {
        clientID,
        clientSecret,
        actualCallbackURL: dynamicCallbackURL,
        expectedCallbackURL: process.env.NODE_ENV === "production" 
          ? "https://" + process.env.REPL_SLUG + ".replit.app/api/auth/google/callback"
          : "https://" + (process.env.REPL_SLUG || "workspace") + ".id.repl.co/api/auth/google/callback"
      },
      environment: {
        isDev: process.env.NODE_ENV === "development",
        host: req.headers.host,
        repl_slug: process.env.REPL_SLUG || "unknown"
      }
    });
  });
  
  // Admin login endpoint
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user has admin role
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. You don't have administrator privileges." });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  
  // Admin protected routes
  app.use("/api/admin", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. You don't have administrator privileges." });
    }
    
    next();
  });
  
  // Admin stats endpoint
  app.get("/api/admin/stats/users", async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const newUsersToday = await storage.getNewUserCountToday();
      const activeSessions = 1; // This would need a real implementation based on your session store
      
      res.json({
        totalUsers,
        newUsersToday,
        activeSessions
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });
  
  app.get("/api/admin/stats/trips", async (req, res) => {
    try {
      const totalTrips = await storage.getTripCount();
      const newTripsToday = await storage.getNewTripCountToday();
      
      res.json({
        totalTrips,
        newTripsToday
      });
    } catch (error) {
      console.error("Error fetching trip stats:", error);
      res.status(500).json({ message: "Failed to fetch trip statistics" });
    }
  });
  
  app.get("/api/admin/stats/destinations", async (req, res) => {
    try {
      const destinations = await storage.getAllDestinations();
      const totalDestinations = destinations.length;
      // This would need a real implementation based on your trip data
      const mostPopular = destinations.length > 0 ? `${destinations[0].name}, ${destinations[0].country}` : null;
      
      res.json({
        totalDestinations,
        mostPopular
      });
    } catch (error) {
      console.error("Error fetching destination stats:", error);
      res.status(500).json({ message: "Failed to fetch destination statistics" });
    }
  });

  // Google authentication routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("Google auth route accessed");
    console.log("Auth URL:", req.url);
    console.log("Auth headers:", req.headers.host, req.headers.referer);
    console.log("Auth user-agent:", req.headers["user-agent"]);
    
    // Update the callback URL based on the current host
    if (req.headers.host) {
      const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
      const dynamicCallbackURL = `${protocol}://${req.headers.host}/api/auth/google/callback`;
      console.log("Updating Google strategy with callback URL:", dynamicCallbackURL);
      
      // Re-register the strategy with the new callback URL
      passport.use('google', new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          callbackURL: dynamicCallbackURL,
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            // Check if user already exists by email
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email provided by Google"));
            }

            // Use email as username to find user, since for Google auth we don't have a username
            let user = await storage.getUserByEmail(email);
            
            if (!user) {
              // Create a new user if not exists
              const username = profile.displayName?.replace(/\s+/g, "") || 
                `user_${Math.random().toString(36).substring(2, 8)}`;
              
              // Check if the username is already taken
              let usernameExists = await storage.getUserByUsername(username);
              let uniqueUsername = username;
              
              // If username exists, add a random string to make it unique
              if (usernameExists) {
                uniqueUsername = `${username}_${Math.random().toString(36).substring(2, 8)}`;
              }
              
              user = await storage.createUser({
                username: uniqueUsername,
                email,
                // Generate a random secure password that won't be used (user will login via Google)
                password: await hashPassword(randomBytes(16).toString('hex')),
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                googleId: profile.id
              });
            } else if (!user.googleId) {
              // If user exists but doesn't have a Google ID, update it
              user = await storage.updateUser(user.id, {
                ...user,
                googleId: profile.id
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      ));
    }
    
    // Override the default passport behavior to log the redirect URL
    const originalRedirect = res.redirect;
    res.redirect = function(url) {
      console.log('DEBUG: Redirecting to Google URL:', url);
      return originalRedirect.call(this, url);
    };
    
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      session: true,
      prompt: 'consent' 
    })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log("Google auth callback received");
      console.log("Callback URL:", req.url);
      console.log("Callback query:", JSON.stringify(req.query));
      console.log("Callback headers:", req.headers.host, req.headers.referer);
      
      // Update the callback URL again based on the current host
      if (req.headers.host) {
        const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
        const dynamicCallbackURL = `${protocol}://${req.headers.host}/api/auth/google/callback`;
        console.log("Updating Google strategy for callback with URL:", dynamicCallbackURL);
        
        // Re-register the strategy with the new callback URL
        // This ensures the strategy is updated even in the callback phase
        passport.use('google', new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: dynamicCallbackURL,
          },
          async (accessToken: any, refreshToken: any, profile: any, done: any) => {
            try {
              // Check if user already exists by email
              const email = profile.emails?.[0]?.value;
              if (!email) {
                return done(new Error("No email provided by Google"));
              }

              // Use email as username to find user
              let user = await storage.getUserByEmail(email);
              
              if (!user) {
                // Create a new user if not exists
                const username = profile.displayName?.replace(/\s+/g, "") || 
                  `user_${Math.random().toString(36).substring(2, 8)}`;
                
                // Check if the username is already taken
                let usernameExists = await storage.getUserByUsername(username);
                let uniqueUsername = username;
                
                // If username exists, add a random string to make it unique
                if (usernameExists) {
                  uniqueUsername = `${username}_${Math.random().toString(36).substring(2, 8)}`;
                }
                
                user = await storage.createUser({
                  username: uniqueUsername,
                  email,
                  // Generate a random secure password
                  password: await hashPassword(randomBytes(16).toString('hex')),
                  firstName: profile.name?.givenName || '',
                  lastName: profile.name?.familyName || '',
                  googleId: profile.id
                });
              } else if (!user.googleId) {
                // If user exists but doesn't have a Google ID, update it
                user = await storage.updateUser(user.id, {
                  ...user,
                  googleId: profile.id
                });
              }
              
              return done(null, user);
            } catch (error) {
              return done(error);
            }
          }
        ));
      }
      
      if (req.query.error) {
        console.error("Google auth error:", req.query.error);
        return res.redirect("/auth?error=" + encodeURIComponent(req.query.error as string));
      }
      next();
    },
    passport.authenticate("google", { 
      failureRedirect: "/auth?error=google_auth_failed",
      failWithError: true 
    }),
    (req, res) => {
      console.log("Google authentication successful");
      // Successful authentication, redirect to home page
      res.redirect("/");
    },
    (err: any, req: any, res: any, next: any) => {
      console.error("Google auth error:", err);
      res.redirect("/auth?error=" + encodeURIComponent(err.message || "Unknown error"));
    }
  );
}
