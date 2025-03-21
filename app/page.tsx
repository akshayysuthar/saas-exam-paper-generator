"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  BookOpen,
  FileText,
  Settings,
  Download,
} from "lucide-react";

import { Loading } from "@/components/Loading";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";

interface DashboardData {
  questionCount: number;
  subjectCount: number;
  contentCount: number;
  recentQuestions: Question[];
}

function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    questionCount: 0,
    subjectCount: 0,
    contentCount: 0,
    recentQuestions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionCount, subjectCount, contentCount, recentQuestions] =
          await Promise.all([
            supabase
              .from("questions")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("subjects")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("contents")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("questions")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        setData({
          questionCount: questionCount.count ?? 0,
          subjectCount: subjectCount.count ?? 0,
          contentCount: contentCount.count ?? 0,
          recentQuestions: recentQuestions.data ?? [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
}

function DashboardContent() {
  const { data, loading } = useDashboardData();

  if (loading) {
    return <Loading title="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-8">
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Questions
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.questionCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subjects
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.subjectCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contents
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.contentCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recentQuestions.map((question: Question) => (
                <li key={question.id} className="text-sm">
                  {question.question.substring(0, 100)}...
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // @ts-expect-error BeforeInstallPromptEvent is not yet in TypeScript
      window.deferredPrompt = e;
      setShowInstallPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    // @ts-expect-error BeforeInstallPromptEvent is not yet in TypeScript
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      // @ts-expect-error BeforeInstallPromptEvent is not yet in TypeScript
      window.deferredPrompt = null;
    }
    setShowInstallPrompt(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Exam Paper Generator Dashboard
      </motion.h1>

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="sm:col-span-1"
        >
          <Link href={isSignedIn ? "/generate-exam" : "/sign-in"}>
            <Button className="w-full h-16 text-lg">
              <FileText className="mr-2 h-6 w-6" /> Generate Exam Paper
            </Button>
          </Link>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Link href={isSignedIn ? "/add-questions" : "/sign-in"}>
            <Button className="w-full h-16 text-base" variant="secondary">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Questions
            </Button>
          </Link>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Link href={isSignedIn ? "/question-bank" : "/sign-in"}>
            <Button className="w-full h-16 text-base" variant="secondary">
              <BookOpen className="mr-2 h-5 w-5" /> View Question Bank
            </Button>
          </Link>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Link href={isSignedIn ? "/manage-content" : "/sign-in"}>
            <Button className="w-full h-16 text-base" variant="secondary">
              <Settings className="mr-2 h-5 w-5" /> Manage Content
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <DashboardContent />

      {showInstallPrompt && (
        <motion.div
          className="fixed bottom-4 right-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button onClick={handleInstall} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </motion.div>
      )}
    </div>
  );
}
