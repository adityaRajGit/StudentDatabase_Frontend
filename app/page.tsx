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
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs
} from 'firebase/firestore';

interface StudentData {
  id: string;
  name: string;
  marks: number;
  timestamp: Timestamp;
}

// Component for the chart
function MarksChart() {
  const [studentData, setStudentData] = React.useState<StudentData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Create a query to get all students, ordered by timestamp
    const q = query(
      collection(db, 'students'),
      orderBy('timestamp', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const students = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StudentData[];
        setStudentData(students);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError("Failed to load student data");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const chartData = studentData.map(student => ({
    name: student.name,
    marks: student.marks
  }));

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Student Marks Distribution</CardTitle>
        <CardDescription>
          Showing marks for all students (Real-time updates)
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
    </Card>
  );
}

// Component for the form
function CardWithForm() {
  const [name, setName] = React.useState("");
  const [marks, setMarks] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!name.trim() || !marks.trim()) {
        setError("Name and marks are required");
        return;
      }

      const marksNumber = Number(marks);
      if (isNaN(marksNumber)) {
        setError("Marks must be a valid number");
        return;
      }

      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'students'), {
        name: name.trim(),
        marks: marksNumber,
        timestamp: Timestamp.now()
      });

      setMessage("Data stored successfully");
      setError("");
      setName("");
      setMarks("");
    } catch (err) {
      console.error("Submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit data");
      setMessage("");
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
              placeholder="Total Marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main layout
export default function Layout() {
  return (
    <div className="flex justify-between space-x-4 p-4">
      <CardWithForm />
      <MarksChart />
    </div>
  );
}