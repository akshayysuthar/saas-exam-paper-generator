"use client";

import { useState, useEffect } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { SubjectSelector } from "@/components/SubjectSelector";
import { ChapterSelector } from "@/components/ChapterSelector";
import { GeneratedExam } from "@/components/GeneratedExam";
import { PdfDownload } from "@/components/PdfDownload";
import { DemoLogin } from "@/components/DemoLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Question, SelectedChapter, SubjectData } from "@/types";

export default function ExamPaperGenerator() {
  const [user, setUser] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [totalMarks, setTotalMarks] = useState(80);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedExam, setGeneratedExam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [userPaperCount, setUserPaperCount] = useState(0);

  useEffect(() => {
    // console.log("Loading ExamPaperGenerator component");
    const fetchData = async () => {
      try {
        const response = await fetch("/questionbank.json");
        const data = await response.json();
        setSubjectData(data);
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Load saved state from localStorage
    const savedUser = localStorage.getItem("user");
    const savedClass = localStorage.getItem("selectedClass");
    const savedBoard = localStorage.getItem("selectedBoard");
    const savedMedium = localStorage.getItem("selectedMedium");
    const savedSubject = localStorage.getItem("selectedSubject");
    const savedTotalMarks = localStorage.getItem("totalMarks");
    const savedGenerationType = localStorage.getItem("generationType");
    const savedUserPaperCount = localStorage.getItem("userPaperCount");

    if (savedUser) setUser(savedUser);
    if (savedClass) setSelectedClass(parseInt(savedClass));
    if (savedBoard) setSelectedBoard(savedBoard);
    if (savedMedium) setSelectedMedium(savedMedium);
    if (savedSubject) setSelectedSubject(savedSubject);
    if (savedTotalMarks) setTotalMarks(parseInt(savedTotalMarks));
    if (savedGenerationType) setGenerationType(savedGenerationType);
    if (savedUserPaperCount) setUserPaperCount(parseInt(savedUserPaperCount));
  }, []);

  const saveToLocalStorage = (key: string, value: string | null) => {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  };

  useEffect(() => {
    // Save state to localStorage whenever it changes
    saveToLocalStorage("user", user);
    saveToLocalStorage("selectedClass", selectedClass?.toString() || null);
    if (selectedBoard) localStorage.setItem("selectedBoard", selectedBoard);
    if (selectedMedium) localStorage.setItem("selectedMedium", selectedMedium);
    if (selectedSubject)
      localStorage.setItem("selectedSubject", selectedSubject);
    localStorage.setItem("totalMarks", totalMarks.toString());
    if (generationType) localStorage.setItem("generationType", generationType);
    localStorage.setItem("userPaperCount", userPaperCount.toString());
  }, [
    user,
    selectedClass,
    selectedBoard,
    selectedMedium,
    selectedSubject,
    totalMarks,
    generationType,
    userPaperCount,
  ]);

  const handleLogin = (username: string) => {
    setUser(username);
    console.log(`User logged in: ${username}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    console.log("User logged out");
  };

  const handleTotalMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalMarks = parseInt(e.target.value) || 0;
    console.log(`Total marks changed to: ${newTotalMarks}`);
    setTotalMarks(newTotalMarks);
  };

  const handleGenerate = () => {
    // console.log("Generating exam paper");
    setGeneratedExam(true);
    const chapters = Array.from(
      new Set(questions.map((q) => ({ id: q.Ch, name: q.name })))
    );
    setSelectedChapters(chapters);
    setUserPaperCount((prevCount) => prevCount + 1);
    console.log({
      user,
      generationType,
      selectedClass,
      selectedBoard,
      selectedMedium,
      selectedSubject,
      selectedQuestions,
      selectedChapters,
      totalMarks,
      userPaperCount: userPaperCount + 1,
    });
  };
  const handleReset = () => {
    // setSelectedClass(null);
    // setSelectedBoard(null);
    // setSelectedMedium(null);
    // setSelectedSubject(null);
    // setSelectedQuestions([]);
    setSelectedChapters([]);
    setTotalMarks(80);
    // setGenerationType(null);
    setGeneratedExam(false);
    // setUserPaperCount(0);
    localStorage.clear(); // Optionally clear localStorage if you want to reset it completely
  };

  const handleGenerationTypeChange = (type: string) => {
    // console.log(`Generation type changed to: ${type}`);
    setGenerationType(type);
  };

  const handleQuestionSelection = (selectedQuestions: Question[]) => {
    setSelectedQuestions(selectedQuestions);
    // Update question selection count
    selectedQuestions.forEach((question) => {
      question.selectionCount = (question.selectionCount || 0) + 1;
      // console.log(
      //   `Question ${question.id} selected. Total selections: ${question.selectionCount}`
      // );
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Exam Paper Generator
        </h1>
        <DemoLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="container mx-auto lg:px-10 px-3 py-4">
      <div className="flex justify-between items-center mb-4 shadow-md py-2">
        <h1 className="text-2xl font-bold">Paper Generator</h1>
        <div className="flex items-center">
          <span className="mr-4">Welcome, {user}!</span>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="flex items-center justify-center mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${
            generationType === "manual"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => handleGenerationTypeChange("manual")}
        >
          Manual Generate
        </button>
        <button
          className={`px-4 py-2 rounded ${
            generationType === "auto" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => handleGenerationTypeChange("auto")}
        >
          Auto Generate
        </button>
      </div>
      <div className="space-y-4 grid grid-cols-1 justify-center gap-4 p-3">
        <ClassSelector
          subjectData={subjectData}
          onSelectClass={setSelectedClass}
          onSelectBoard={setSelectedBoard}
          onSelectMedium={setSelectedMedium}
          initialClass={selectedClass}
          initialBoard={selectedBoard}
          initialMedium={selectedMedium}
        />
        {selectedClass && selectedBoard && selectedMedium && (
          <SubjectSelector
            subjectData={subjectData}
            classNumber={selectedClass}
            board={selectedBoard}
            medium={selectedMedium}
            onSelectSubject={setSelectedSubject}
            initialSubject={selectedSubject}
          />
        )}
        <div>
          <Label htmlFor="totalMarks">Total Marks</Label>
          <Input
            id="totalMarks"
            type="number"
            value={totalMarks}
            onChange={handleTotalMarksChange}
            className="w-24"
          />
        </div>
        {selectedSubject && (
          <ChapterSelector
            questions={questions.filter(
              (item) =>
                item.class === selectedClass &&
                item.board === selectedBoard &&
                item.subject === selectedSubject
            )}
            onSelectQuestions={handleQuestionSelection}
            onSelectChapters={() => {}}
          />
        )}

        <div className="grid grid-cols-3 items-center justify-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={selectedQuestions.length === 0}
            className="col-span-2"
          >
            Generate Exam Paper
          </Button>
          <Button
            onClick={handleReset}
            className="col-span-1"
            variant="destructive"
          >
            Reset
          </Button>
        </div>
      </div>

      {generatedExam && (
        <div className="mt-8">
          <div id="examPaperContent">
            <GeneratedExam
              selectedQuestions={selectedQuestions}
              instituteName="Prayass Teaching Institute"
              standard={selectedClass}
              subject={selectedSubject}
              // To remove duplicates
              chapters={selectedChapters
                .filter(
                  (value, index, self) =>
                    index === self.findIndex((t) => t.id === value.id)
                )
                .map((ch) => ch.id)}
              studentName={""}
              teacherName={user}
              totalMarks={totalMarks}
            />
          </div>
          <div className="mt-4 flex justify-center space-x-4">
            <PdfDownload
              selectedQuestions={selectedQuestions}
              instituteName="ABC School"
              standard={selectedClass}
              subject={selectedSubject}
              // To remove duplicates
              chapters={selectedChapters
                .filter(
                  (value, index, self) =>
                    index === self.findIndex((t) => t.id === value.id)
                )
                .map((ch) => ch.id)}
              studentName={""}
              teacherName={user}
              totalMarks={totalMarks}
            />
          </div>
        </div>
      )}
      <div className="mt-4 text-center"></div>

      <footer className="mt-8 flex justify-between text-sm text-gray-500">
        <p>Created by Akshay</p>
        <p>
          Total papers generated {user}: {userPaperCount}
        </p>
        <p>App Version: 1.0.0-dev</p>
      </footer>
    </div>
  );
}
