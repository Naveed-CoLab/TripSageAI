import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

const adminLoginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { user, adminLoginMutation, isLoading } = useAuth();
  
  // Redirect if user is already logged in and is an admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate("/admin/dashboard");
    } else if (user && user.role !== 'admin') {
      // If logged in but not admin, redirect to home
      navigate("/");
    }
  }, [user, navigate]);

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onAdminLoginSubmit(data: AdminLoginFormValues) {
    adminLoginMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full p-4 md:p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="h-20 w-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600 max-w-sm mx-auto">Secure access to the TripSage administrative dashboard</p>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 pt-6">
            <Form {...adminLoginForm}>
              <form onSubmit={adminLoginForm.handleSubmit(onAdminLoginSubmit)} className="space-y-5">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">Sign In</h2>
                  <p className="text-sm text-gray-500">Enter your admin credentials to continue</p>
                </div>
                
                <FormField
                  control={adminLoginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your admin username" 
                          className="h-11 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adminLoginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <Button variant="link" className="text-xs h-auto p-0 text-indigo-600">
                          Forgot password?
                        </Button>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          className="h-11 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-md" 
                  disabled={adminLoginMutation.isPending}
                >
                  {adminLoginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/")}
                    type="button"
                    className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Return to TripSage
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Protected administrative area • {new Date().getFullYear()} © TripSage</p>
        </div>
      </div>
    </div>
  );
}