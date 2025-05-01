
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Key, Plane, History, ChevronRight, Save, X, AlertCircle, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define our profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

// Define our password update schema
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordUpdateFormValues = z.infer<typeof passwordUpdateSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  if (!user) return null;
  
  // Initialize our form with the current user data
  const profileForm = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
    },
  });
  
  // Initialize password form
  const passwordForm = useForm<PasswordUpdateFormValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Define our profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: ProfileUpdateFormValues) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Define our password update mutation
  const passwordUpdateMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle profile form submission
  const onProfileSubmit = (values: ProfileUpdateFormValues) => {
    profileUpdateMutation.mutate(values);
  };
  
  // Handle password form submission
  const onPasswordSubmit = (values: PasswordUpdateFormValues) => {
    passwordUpdateMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                      {user.firstName ? user.firstName.charAt(0) : user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{user.firstName || user.username}</CardTitle>
                    <p className="text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First name</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={profileUpdateMutation.isPending}
                        >
                          {profileUpdateMutation.isPending ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" /> Save changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : isChangingPassword ? (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription>
                          Changing your password will log you out of all other devices.
                        </AlertDescription>
                      </Alert>
                      
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="New password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm new password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsChangingPassword(false)}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={passwordUpdateMutation.isPending}
                        >
                          {passwordUpdateMutation.isPending ? (
                            <>Updating...</>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Update password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Username</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Password</p>
                        <p className="font-medium">••••••••</p>
                        <Button 
                          variant="link" 
                          className="px-0 h-auto text-xs" 
                          onClick={() => setIsChangingPassword(true)}
                        >
                          Change password
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="grid gap-6">
              {/* Flight Search History Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Flight Search History</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate('/profile/flights')}
                    >
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Your recent flight searches and saved travel preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    className="flex flex-col gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => navigate('/profile/flights')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2.5">
                        <History className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">View Your Flight History</h3>
                        <p className="text-sm text-gray-500">See all your past flight searches in one place</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-2 border-blue-200 text-blue-600 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/profile/flights');
                      }}
                    >
                      View Flight History
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Hotel Search History Card */}
              <Card className="overflow-hidden mt-6">
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg 
                        className="h-5 w-5 text-teal-600" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                        <path d="M1 21h22"></path>
                        <path d="M7 14h.01"></path>
                        <path d="M11 14h.01"></path>
                        <path d="M15 14h.01"></path>
                        <path d="M7 10h.01"></path>
                        <path d="M11 10h.01"></path>
                        <path d="M15 10h.01"></path>
                      </svg>
                      <CardTitle className="text-lg">Hotel Search History</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-teal-600 hover:bg-teal-50"
                      onClick={() => navigate('/profile/hotels')}
                    >
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Your recent hotel searches and accommodation preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    className="flex flex-col gap-4 rounded-lg border border-teal-100 bg-teal-50 p-4 cursor-pointer hover:bg-teal-100 transition-colors"
                    onClick={() => navigate('/profile/hotels')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-teal-100 p-2.5">
                        <History className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">View Your Hotel History</h3>
                        <p className="text-sm text-gray-500">See all your past hotel searches in one place</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-2 border-teal-200 text-teal-600 hover:bg-teal-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/profile/hotels');
                      }}
                    >
                      View Hotel History
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Other activity cards can go here */}
            </div>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Preference settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
