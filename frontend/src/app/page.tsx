"use client";

import { useState } from "react";

export default function Home() {
  const [resume, setResume] = useState<File | null>(null);

  const [jobDescription, setJobDescription] = useState("");

  const [jdUrl, setJdUrl] = useState("");

  const [fetchingJD, setFetchingJD] = useState(false);

  const [analysis, setAnalysis] = useState<any[]>([]);

  const [matchScore, setMatchScore] = useState<number | null>(null);

  const [recruiterConfidence, setRecruiterConfidence] = useState("");

  const [recruiterVerdict, setRecruiterVerdict] = useState("");

  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [mockAnswers, setMockAnswers] = useState<{ [key: number]: string }>({});

  const [feedbackByQuestion, setFeedbackByQuestion] = useState<{ [key: number]: any }>({});

  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [tailoredResume, setTailoredResume] = useState<any>(null);

  const [tailoringLoading, setTailoringLoading] = useState(false);

  const [initialAtsScore, setInitialAtsScore] = useState<number | null>(null);

  const [initialAtsReasoning, setInitialAtsReasoning] = useState<string[]>([]);

  const [showJDModal, setShowJDModal] = useState(false);

  const [showAtsModal, setShowAtsModal] = useState(false);

  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const [downloadLoading, setDownloadLoading] = useState("");

const analyzeJD = async () => {
  if (!resume) {
    alert("Please upload your resume first.");
    return;
  }

  if (!jobDescription.trim()) {
    alert("Please paste a job description or JD link.");
    return;
  }

  try {
    setLoading(true);


let finalJobDescription = jobDescription;

if (jobDescription.trim().startsWith("http")) {
  setFetchingJD(true);

  const jdResponse = await fetch("https://futurehireai.onrender.com/extract-jd-from-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: jobDescription.trim(),
    }),
  });

  const jdData = await jdResponse.json();

  if (!jdData.job_description) {
    alert("Could not extract JD from this link.");
    return;
  }

  finalJobDescription = jdData.job_description;
  setJobDescription(jdData.job_description);
  setFetchingJD(false);
}

    // Upload resume first
    const formData = new FormData();
    formData.append("file", resume);

    const uploadResponse = await fetch(
      "https://futurehireai.onrender.com/upload-resume",
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();

    // Compare resume with JD
    const compareResponse = await fetch(
      "https://futurehireai.onrender.com/compare-resume-jd",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: uploadData.resume_text,
          job_description: finalJobDescription,
        }),
      }
    );

    const data = await compareResponse.json();

    setInitialAtsScore(data.initial_ats_score ?? null);
    setInitialAtsReasoning(data.initial_ats_reasoning || []);

    const formattedAnalysis = [
      {
        title: "Top Strengths",
        items: data.top_strengths,
      },
      {
        title: "Critical Gaps",
        items: data.critical_gaps,
      },
      {
        title: "Recruiter Concerns",
        items: data.recruiter_concerns,
      },
      {
        title: "Likely Rejection Reasons",
        items: data.likely_rejection_reasons,
      },
      {
        title: "Technical Depth Concerns",
        items: data.technical_depth_concerns,
      },
      {
        title: "Hidden Role Expectations",
        items: data.hidden_role_expectations,
      },
      {
        title: "Resume Bullet Improvements",
        items: data.resume_bullet_improvements,
      },
      {
        title: "High Priority Study Areas",
        items: data.high_priority_study_areas,
      },
      {
        title: "Likely Interviewer Focus Areas",
        items: data.likely_interviewer_focus_areas,
      },
      {
        title: "Scenario Based Questions",
        items: data.scenario_based_questions,
      },
      {
        title: "Common Interview Questions",
        items: data.common_interview_questions,
      },
      {
        title: "Mock Interview Questions",
        items: data.mock_interview_questions || data.scenario_based_questions || [],
      },
    ];

    setAnalysis(formattedAnalysis);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

const getAnswerFeedback = async () => {
  try {
    setFeedbackLoading(true);

    const question = analysis[11]?.items?.[currentQuestionIndex];

    const response = await fetch("https://futurehireai.onrender.com/evaluate-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        answer: mockAnswers[currentQuestionIndex] || "",
        job_description: jobDescription,
      }),
    });

    const data = await response.json();

    setMatchScore(data.match_score || null);
    setRecruiterConfidence(data.recruiter_confidence || "");
    setRecruiterVerdict(data.recruiter_verdict || "");

    setFeedbackByQuestion({
      ...feedbackByQuestion,
      [currentQuestionIndex]: data,
    });
  } catch (error) {
    console.error(error);
  } finally {
    setFeedbackLoading(false);
  }
};

const generateTailoredResume = async () => {
  if (!resume) {
    alert("Please upload your resume first.");
    return;
  }

  if (!jobDescription.trim()) {
    alert("Please paste a job description or JD link first.");
    return;
  }

  try {
    setTailoringLoading(true);

    const formData = new FormData();
    formData.append("file", resume);

    const uploadResponse = await fetch("https://futurehireai.onrender.com/upload-resume", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    const response = await fetch("https://futurehireai.onrender.com/generate-tailored-resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: uploadData.resume_text,
        job_description: jobDescription,
      }),
    });

    const data = await response.json();

    setTailoredResume(data);
  } catch (error) {
    console.error(error);
    alert("Something went wrong while generating your tailored resume.");
  } finally {
    setTailoringLoading(false);
  }
};

const fetchJDFromUrl = async () => {
  try {
    setFetchingJD(true);

    if (!jdUrl.trim()) {
      alert("Please paste a JD link.");
      return;
    }

    const response = await fetch("https://futurehireai.onrender.com/extract-jd-from-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: jdUrl,
      }),
    });

    const data = await response.json();

    if (data.job_description) {
      setJobDescription(data.job_description);
    } else {
      alert("Could not extract JD from this link.");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong while fetching JD.");
  } finally {
    setFetchingJD(false);
  }
};

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">
          FutureHire AI
        </h1>

        <button
          onClick={() => alert("More AI-powered features launching soon")}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-gray-200 hover:bg-white/10 transition-all"
        >
          Join Beta
        </button>
      </nav>

      {/* Hero Section */}
<section className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 text-center pt-16 sm:pt-20 pb-14 sm:pb-16">

<p className="-mt-14 mb-8 max-w-4xl text-center text-lg leading-relaxed text-gray-300">
  Most platforms stop at resume generation.
  We prepare you for the entire interview journey 
  all in one platform.
</p>

<div className="mb-8 w-full overflow-hidden border-y border-white/10 bg-white/5 py-3 backdrop-blur-md">
<div className="animate-marquee flex whitespace-nowrap text-sm sm:text-base font-medium tracking-wide text-gray-200">
  <span className="mx-8">
    Built from real job-market struggles — not from theory • ATS Optimization • Interview Preparation • JD Intelligence • Resume Tailoring • Career Guidance • Affordable AI Career Support Built To Help Candidates Become Truly Interview-Ready
  </span>

  <span className="mx-8">
    Built from real job-market struggles — not from theory • ATS Optimization • Interview Preparation • JD Intelligence • Resume Tailoring • Career Guidance • Affordable AI Career Support Built To Help Candidates Become Truly Interview-Ready
  </span>
</div>
</div>

  <div className="mb-5 rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-blue-100 backdrop-blur-xl">
  AI-powered Career Intelligence Platform
</div>

        <h1 className="mt-6 sm:mt-8 max-w-5xl text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
          Don’t Just
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {" "}Rewrite Resumes
          </span>
          .
          <br />
          Prepare For The Actual Job.
        </h1>

        <p className="mt-6 sm:mt-8 max-w-2xl text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed px-2 sm:px-0">
          Upload your resume and a job description.
          Our AI analyzes recruiter expectations,
          asks proactive technical questions,
          detects skill gaps,
          and tells you exactly what to study before applying.
        </p>

        <div className="mt-4 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs sm:text-sm text-yellow-200 backdrop-blur-xl">
          Early Beta Access • First 5 analyses free
        </div>

        {/* CTA Buttons */}
  <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-[220px_1fr_220px]">

{resume ? (
  <label className="flex h-16 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-center text-blue-300 backdrop-blur-md hover:bg-white/10 transition-all duration-300 overflow-hidden">
  <span className="max-w-full truncate">
    {resume.name}
  </span>

    <input
      type="file"
      accept=".pdf,.doc,.docx"
      className="hidden"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setResume(e.target.files[0]);
          e.target.value = "";
        }
      }}
    />
  </label>
) : (

  <label className="flex h-16 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-gray-300 font-medium backdrop-blur-md hover:bg-white/10 transition-all duration-300">
    Upload Resume

    <input
      type="file"
      accept=".pdf,.doc,.docx"
      className="hidden"
      onChange={(e) => {
  if (e.target.files?.[0]) {
    setResume(e.target.files[0]);

    // allow re-uploading same file again
    e.target.value = "";
  }
}}
    />
  </label>
)}

  <div>

    <textarea
      placeholder="Paste JD text or JD link here..."
      value={jobDescription}
      onChange={(e) => {
        setJobDescription(e.target.value);
        setJdUrl(e.target.value);
}}
      className="h-16 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-400 backdrop-blur-md outline-none"
    />

    <div className="mt-3 flex items-center justify-between gap-4">
      <p className="text-sm text-gray-400">
        {jobDescription.length} characters
      </p>

      {jobDescription.trim().length > 0 && (
  <button
    onClick={() => setShowJDModal(true)}
    className="text-sm text-blue-400 hover:text-blue-300"
  >
    View Full JD
  </button>
)}
    </div>

    <button
      onClick={analyzeJD}
      className="mt-4 rounded-2xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-600 transition-all duration-300"
    >
      {fetchingJD
  ? "Fetching JD..."
  : loading
  ? "Analyzing Resume..."
  : "Analyze JD"}
    </button>
  </div>

</div>

{showJDModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
    <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-8 text-left">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Full Job Description
        </h2>

        <button
          onClick={() => setShowJDModal(false)}
          className="rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Close
        </button>
      </div>

      <p className="whitespace-pre-wrap text-gray-300">
        {jobDescription || "No job description pasted yet."}
      </p>
    </div>
  </div>
)}

{showAtsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
    <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-8 text-left">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Why This ATS Score?
        </h2>

        <button
          onClick={() => setShowAtsModal(false)}
          className="rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Close
        </button>
      </div>

      <p className="mb-6 text-5xl font-black text-blue-400">
        {initialAtsScore}%
      </p>

      <div className="space-y-3 text-gray-300">
        {initialAtsReasoning.map((item, index) => (
          <p key={index}>- {item}</p>
        ))}
      </div>
    </div>
  </div>
)}

        {/* Uploaded File */}
        
{analysis.length > 0 && (
  <div className="mt-12 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-md">
    <h2 className="mb-8 text-3xl font-bold text-white">
      AI Analysis
    </h2>

    <div className="mb-8 grid gap-4 md:grid-cols-3">

  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6">
    <p className="text-sm text-gray-300">ATS Match Score</p>

    <h3 className="mt-2 text-4xl font-bold text-white">
      {matchScore ? `${matchScore}/100` : "--"}
    </h3>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <p className="text-sm text-gray-300">Recruiter Confidence</p>

    <h3 className="mt-2 text-2xl font-semibold text-blue-300">
      {recruiterConfidence || "Pending"}
    </h3>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <p className="text-sm text-gray-300">Recruiter Verdict</p>

    <p className="mt-2 text-sm leading-7 text-gray-200">
      {recruiterVerdict || "Generating recruiter assessment..."}
    </p>
  </div>

</div>

    <div className="mb-8 flex flex-wrap gap-4">
      {[
        { id: "overview", label: "Overview" },
        { id: "resume", label: "Resume Fixes" },
        { id: "prep", label: "Interview Prep" },
        { id: "mock", label: "Mock Interview" },
        { id: "tailored", label: "Tailored Resume" },

      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`rounded-xl px-4 py-2 font-semibold transition-all ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

   <div className="space-y-8">
  {activeTab === "overview" &&
    analysis.slice(0, 4).map((section: any, index: number) => (
      <AnalysisCard key={index} section={section} color="text-blue-300" />
    ))}

  {activeTab === "resume" &&
    analysis.slice(4, 7).map((section: any, index: number) => (
      <AnalysisCard key={index} section={section} color="text-blue-300" />
    ))}

  {activeTab === "prep" &&
    analysis.slice(7, 11).map((section: any, index: number) => (
      <AnalysisCard key={index} section={section} color="text-blue-300" />
    ))}

  {activeTab === "mock" && (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-2xl font-semibold text-blue-300">
        Mock Interview
      </h2>

    <p className="mb-6 text-gray-300">
      Practice answering one recruiter-style question at a time.
    </p>

    {analysis[11]?.items?.length > 0 ? (
      <>
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <p className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} of {analysis[11].items.length}
          </p>

          <h3 className="mt-3 text-xl font-semibold text-white">
            {analysis[11].items[currentQuestionIndex]}
          </h3>
        </div>

        <textarea
          value={mockAnswers[currentQuestionIndex] || ""}
          onChange={(e) =>
            setMockAnswers({
              ...mockAnswers,
              [currentQuestionIndex]: e.target.value,
            })
          }
          placeholder="Type your answer here..."
          className="h-40 w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-white placeholder:text-gray-400 outline-none"
        />

        <button
          onClick={getAnswerFeedback}
          className="mt-4 rounded-xl bg-pink-600 px-5 py-3 text-white hover:bg-pink-700"
        >
          {feedbackLoading ? "Reviewing..." : "Get Feedback"}
        </button>

        {feedbackByQuestion[currentQuestionIndex] && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
            <h3 className="mb-4 text-xl font-bold text-blue-300">
              Interview Feedback
            </h3>

            <h4 className="mt-4 font-semibold text-white">What You Did Well</h4>
            {feedbackByQuestion[currentQuestionIndex].strengths?.map(
              (item: string, index: number) => (
                <p key={index} className="text-gray-300">
                  - {item}
                </p>
              )
            )}

            <h4 className="mt-4 font-semibold text-white">How To Improve</h4>
            {feedbackByQuestion[currentQuestionIndex].improvements?.map(
              (item: string, index: number) => (
                <p key={index} className="text-gray-300">
                  - {item}
                </p>
              )
            )}

            <h4 className="mt-4 font-semibold text-white">Missing Concepts</h4>
            {feedbackByQuestion[currentQuestionIndex].missing_concepts?.map(
              (item: string, index: number) => (
                <p key={index} className="text-gray-300">
                  - {item}
                </p>
              )
            )}

            <h4 className="mt-4 font-semibold text-white">Stronger Sample Answer</h4>
            <p className="text-gray-300">
              {feedbackByQuestion[currentQuestionIndex].better_answer}
            </p>

            <h4 className="mt-4 font-semibold text-white">Follow-Up Question</h4>
            <p className="text-gray-300">
              {feedbackByQuestion[currentQuestionIndex].follow_up_question}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
            }}
            className="rounded-xl bg-white/10 px-5 py-3 text-white hover:bg-white/20"
          >
            Previous
          </button>

          <button
            onClick={() => {
              setCurrentQuestionIndex((prev) =>
                Math.min(prev + 1, analysis[11].items.length - 1)
              );
            }}
            className="rounded-xl bg-pink-600 px-5 py-3 text-white hover:bg-pink-700"
          >
            Next Question
          </button>
        </div>
      </>
    ) : (
      <p className="text-gray-400">
        Mock interview questions will appear after analysis.
      </p>
    )}
  </div>
)}

{activeTab === "tailored" && (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <h2 className="mb-4 text-2xl font-semibold text-yellow-400">
      Tailored Resume
    </h2>

    <button
      onClick={generateTailoredResume}
      className="mb-6 w-full sm:w-auto rounded-xl bg-yellow-500 px-5 sm:px-6 py-3 font-semibold text-black hover:bg-yellow-400 transition-all"
    >
      {tailoringLoading
  ? "Tailoring Resume..."
  : "Generate Tailored Resume"}
    </button>

    {tailoredResume && (
      <div className="space-y-6 text-gray-300">
        <div>
          <h3 className="text-xl font-semibold text-white">
            ATS Match
          </h3>

          <p className="text-5xl font-black text-white">
            {tailoredResume.projected_ats_score_after_tailoring}%
          </p>

          <p className="mt-2 text-gray-400">
            Optimized ATS Match After Tailoring
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">
            Why This Score
          </h3>

          {tailoredResume.ats_score_reasoning?.map(
            (item: string, index: number) => (
              <p key={index}>- {item}</p>
            )
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Tailored Resume
            </h3>

            <div className="relative">
              <button
                onClick={() =>
                  setShowDownloadOptions(!showDownloadOptions)
                }
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Download Resume
              </button>

              {showDownloadOptions && (
                <div className="absolute right-0 mt-3 flex gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-3 shadow-xl">
                  <button
                    onClick={async () => {
                      setDownloadLoading("word");
                      const response = await fetch(
                        "https://futurehireai.onrender.com/download-tailored-resume-docx",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            tailored_resume:
                              tailoredResume.tailored_resume,
                          }),
                        }
                      );

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");

                      a.href = url;
                      a.download = "tailored_resume.docx";

                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setDownloadLoading("");
                    }}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                  >
                    {downloadLoading === "word" ? "Preparing..." : "Word"}
                  </button>

                  <button
                    onClick={async () => {
                      setDownloadLoading("pdf");
                      const response = await fetch(
                        "https://futurehireai.onrender.com/download-tailored-resume-pdf",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            tailored_resume:
                              tailoredResume.tailored_resume,
                          }),
                        }
                      );

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");

                      a.href = url;
                      a.download = "tailored_resume.pdf";

                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setDownloadLoading("");
                    }}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                  >
                    {downloadLoading === "pdf" ? "Preparing..." : "PDF"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-6 text-gray-300">
            {tailoredResume.tailored_resume}
          </div>
        </div>
      </div>
    )}
  </div>
)}

    </div>
  </div>
)}

{/* Stats */}

        {/* Stats */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-5xl px-2 sm:px-0">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
            <h3 className="text-4xl font-bold">Smart</h3>
            <p className="mt-3 text-gray-400">
              AI asks proactive questions recruiters actually care about.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
            <h3 className="text-4xl font-bold">Adaptive</h3>
            <p className="mt-3 text-gray-400">
              Every question changes based on the job description.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
            <h3 className="text-4xl font-bold">Focused</h3>
            <p className="mt-3 text-gray-400">
              Get personalized study plans before interviews.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-10 backdrop-blur-md">
            <p className="text-sm uppercase tracking-widest text-blue-300">
              JD Intelligence
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Understand what companies actually expect.
            </h2>

            <p className="mt-4 text-gray-300 leading-relaxed">
              Our AI reads job descriptions like a recruiter.
              It detects hidden expectations,
              interview focus areas,
              missing skills,
              and technical depth requirements.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-10 backdrop-blur-md">
            <p className="text-sm uppercase tracking-widest text-purple-300">
              Preparation Engine
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Know exactly what to study.
            </h2>

            <p className="mt-4 text-gray-300 leading-relaxed">
              Instead of generic resume optimization,
              get personalized preparation guidance,
              proactive interview questions,
              project suggestions,
              and role-specific study plans.
            </p>
          </div>
        </div>
      </section>

    <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
  © {new Date().getFullYear()} FutureHireAI. All rights reserved.
    </footer>

    </main>
  );
}

function AnalysisCard({
  section,
  color,
}: {
  section: any;
  color: string;
}) {
  
  if (!section.items || section.items.length === 0) {
  return null;
}

return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className={`mb-3 text-2xl font-semibold ${color}`}>
        {section.title}
      </h2>

      <div className="space-y-3">
        {section.items?.map((item: string, itemIndex: number) => (
          <p key={itemIndex} className="text-gray-300 leading-7">
            - {item}
          </p>
        ))}
      </div>
    </div>
  );
}