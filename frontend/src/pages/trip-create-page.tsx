import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertTripSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, X } from "lucide-react";

const createTripSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  destination: z.string().min(2, "Destination is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  status: z.string().default("draft"),
});

type CreateTripFormValues = z.infer<typeof createTripSchema>;

export default function TripCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newPreference, setNewPreference] = useState("");
  
  const form = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: "",
      destination: "",
      preferences: [],
      status: "draft",
    },
  });
  
  const createTripMutation = useMutation({
    mutationFn: async (data: CreateTripFormValues) => {
      const res = await apiRequest("/api/trips", "POST", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Trip created",
        description: "Your trip has been created successfully.",
      });
      navigate(`/trips/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create trip: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleAddPreference = () => {
    if (newPreference.trim() === "") return;
    
    const currentPreferences = form.getValues("preferences") || [];
    form.setValue("preferences", [...currentPreferences, newPreference]);
    setNewPreference("");
  };
  
  const handleRemovePreference = (preference: string) => {
    const currentPreferences = form.getValues("preferences") || [];
    form.setValue(
      "preferences", 
      currentPreferences.filter(p => p !== preference)
    );
  };
  
  const onSubmit = (data: CreateTripFormValues) => {
    createTripMutation.mutate(data);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create a New Trip</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Vacation in Europe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris, France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <DatePicker
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <DatePicker
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < (form.getValues("startDate") || new Date())}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="$1,000 - $2,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Preferences</FormLabel>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {field.value?.map((preference) => (
                            <Badge key={preference} variant="secondary" className="flex items-center gap-1">
                              {preference}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleRemovePreference(preference)} 
                              />
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a travel preference (e.g., Food, Culture, Adventure)"
                            value={newPreference}
                            onChange={(e) => setNewPreference(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPreference();
                              }
                            }}
                          />
                          <Button type="button" size="sm" onClick={handleAddPreference} variant="outline">
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" onClick={() => navigate("/trips")}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTripMutation.isPending}
                    >
                      {createTripMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Trip"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
