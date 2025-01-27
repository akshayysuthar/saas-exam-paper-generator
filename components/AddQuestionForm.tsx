"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetadataForm } from "./MetadataForm";
import { QuestionForm } from "./QuestionForm";
import { useUser } from "@clerk/nextjs";

export function AddQuestionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    {
      question: "",
      question_gu: "",
      question_images: [],
      question_images_gu: [],
      answer: "",
      answer_gu: "",
      answer_images: [],
      answer_images_gu: [],
      marks: 1,
      selection_count: 0,
      is_reviewed: false,
      reviewed_by: "",
    },
  ]);
  const [metadata, setMetadata] = useState({
    content_id: null,
    subject_id: null,
    sectionTitle: "",
    type: "",
  });
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
    }
  }, [user]);

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching recent entries:", error);
    } else {
      const entriesBySubject: Record<string, Partial<Question>[]> = {};
      data?.forEach((question) => {
        if (!entriesBySubject[question.subject_id]) {
          entriesBySubject[question.subject_id] = [];
        }
        if (entriesBySubject[question.subject_id].length < 5) {
          entriesBySubject[question.subject_id].push(question);
        }
      });
      //setRecentEntries(entriesBySubject);
    }
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = {
        ...newQuestions[index],
        [name]: name === "marks" ? Number.parseInt(value, 10) : value,
      };
      return newQuestions;
    });
  };

  const handleReviewStatusChange = (index: number, isReviewed: boolean) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = {
        ...newQuestions[index],
        is_reviewed: isReviewed,
        reviewed_by: isReviewed ? user?.fullName || "Current User" : "",
      };
      return newQuestions;
    });
  };

  const handleImageUpload = async (
    index: number,
    files: File[],
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("question-images").getPublicUrl(data.path);
        uploadedUrls.push(publicUrl);
      }
    }

    setQuestions((prev) => {
      const newQuestions = [...prev];
      const fieldName = `${type}_images${language === "gu" ? "_gu" : ""}`;
      const currentImages = newQuestions[index][fieldName] || [];
      const newImages = [...currentImages, ...uploadedUrls];
      newQuestions[index] = {
        ...newQuestions[index],
        [fieldName]: newImages,
        [`${type}${language === "gu" ? "_gu" : ""}`]: `${
          newQuestions[index][`${type}${language === "gu" ? "_gu" : ""}`] || ""
        } [img${newImages.length}]`,
      };
      return newQuestions;
    });
  };

  const handleImageRemove = (
    questionIndex: number,
    imageIndex: number,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const fieldName = `${type}_images${language === "gu" ? "_gu" : ""}`;
      const images = newQuestions[questionIndex][fieldName] as string[];
      images.splice(imageIndex, 1);
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        [fieldName]: images,
        [`${type}${language === "gu" ? "_gu" : ""}`]: (
          newQuestions[questionIndex][
            `${type}${language === "gu" ? "_gu" : ""}`
          ] as string
        )
          .replace(`[img${imageIndex + 1}]`, "")
          .trim(),
      };
      return newQuestions;
    });
  };

  const handleSaveQuestions = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionsToSave = questions.map((question) => ({
        ...metadata,
        ...question,
        created_by: user.id,
        content_id: metadata.content_id
          ? Number.parseInt(metadata.content_id, 10)
          : null,
        subject_id: metadata.subject_id
          ? Number.parseInt(metadata.subject_id, 10)
          : null,
        marks: question.marks || 1,
      }));

      const { error } = await supabase
        .from("questions")
        .insert(questionsToSave)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questions.length} question(s) saved successfully!`,
      });

      // Reset the form state
      setQuestions([
        {
          question: "",
          question_gu: "",
          question_images: [],
          question_images_gu: [],
          answer: "",
          answer_gu: "",
          answer_images: [],
          answer_images_gu: [],
          marks: 1,
          selection_count: 0,
          is_reviewed: false,
          reviewed_by: "",
        },
      ]);
    } catch (error) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        selection_count: 0,
        is_reviewed: false,
        reviewed_by: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetFormState = () => {
    setQuestions([
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        selection_count: 0,
        is_reviewed: false,
        reviewed_by: "",
      },
    ]);
    setMetadata({
      content_id: null,
      subject_id: null,
      sectionTitle: "",
      type: "",
    });
  };

  if (!user) {
    return <div>Please log in to access this form.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h2 className="text-2xl font-bold">Add New Questions</h2>
        <MetadataForm
          metadata={metadata}
          handleMetadataChange={handleMetadataChange}
        />
        {questions.map((question, index) => (
          <div key={index} className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
            <QuestionForm
              currentQuestion={question}
              handleQuestionChange={(e) => handleQuestionChange(index, e)}
              handleImageUpload={(files, type, language) =>
                handleImageUpload(index, files, type, language)
              }
              handleImageRemove={(imageIndex, type, language) =>
                handleImageRemove(index, imageIndex, type, language)
              }
              handleReviewStatusChange={(isReviewed) =>
                handleReviewStatusChange(index, isReviewed)
              }
              isSubmitting={isSubmitting}
              questionType={metadata.type}
              removeQuestion={() => removeQuestion(index)}
            />
          </div>
        ))}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <Button onClick={addNewQuestion}>Add Another Question</Button>
          <Button onClick={resetFormState}>Clear All</Button>
          <Button
            onClick={handleSaveQuestions}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save All Questions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
