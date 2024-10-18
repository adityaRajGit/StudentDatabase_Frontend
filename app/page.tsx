"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from 'axios';


interface StudentData {
  id: string;
  name: string;
  marks: number;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';


const api = {
  getAllStudents: async (): Promise<StudentData[]> => {
    const response = await axios.get<ApiResponse>(`${API_BASE_URL}/students`);
    return response.data.success ? response.data.data : [];
  },

  addStudent: async (name: string, marks: number): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/students`, {
      name,
      marks
    });
    return response.data;
  },

  getTopPerformers: async (limit: number = 5): Promise<StudentData[]> => {
    const response = await axios.get<ApiResponse>(
      `${API_BASE_URL}/top-performers?limit=${limit}`
    );
    return response.data.success ? response.data.data : [];
  }
};


function MarksChart() {
  const [studentData, setStudentData] = React.useState<StudentData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchData = React.useCallback(async () => {
    try {
      const data = await api.getAllStudents();
      setStudentData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();

    
    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const chartData = studentData.map(student => ({
    name: student.name,
    marks: student.marks
  }));

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Student Marks Distribution</CardTitle>
        <CardDescription>
          Showing marks for all students (Updates every 5 seconds)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="h-[400px] w-full">
            <BarChart
              width={550}
              height={350}
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="marks" fill="#8884d8" />
            </BarChart>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Button 
          variant="outline" 
          onClick={fetchData}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}


function CardWithForm({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
  const [name, setName] = React.useState("");
  const [marks, setMarks] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (!name.trim() || !marks.trim()) {
        setError("Name and marks are required");
        return;
      }

      const marksNumber = Number(marks);
      if (isNaN(marksNumber) || marksNumber < 0 || marksNumber > 100) {
        setError("Marks must be a number between 0 and 100");
        return;
      }

      const response = await api.addStudent(name.trim(), marksNumber);
      
      if (response.success) {
        setMessage(response.message || "Data stored successfully");
        setName("");
        setMarks("");
        onSubmitSuccess();
      } else {
        setError(response.error || "Failed to submit data");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Project</CardTitle>
        <CardDescription>Enter Marks for Candidate</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Candidate Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              type="number"
              min="0"
              max="100"
              placeholder="Total Marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          {message && (
            <p className="text-green-600 text-sm animate-fadeIn">{message}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm animate-fadeIn">{error}</p>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function Layout() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleSubmitSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Student Marks Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <CardWithForm onSubmitSuccess={handleSubmitSuccess} />
          <MarksChart key={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}