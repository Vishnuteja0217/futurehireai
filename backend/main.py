from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from resume_parser import extract_resume_text
from fastapi.responses import FileResponse
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
import uuid

import os
import json
import requests
from bs4 import BeautifulSoup

load_dotenv()

app = FastAPI()

# Enable frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def add_horizontal_line(paragraph):
    p = paragraph._p
    pPr = p.get_or_add_pPr()

    border = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')

    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'D1D5DB')

    border.append(bottom)
    pPr.append(border)

# Request schema
class JDRequest(BaseModel):
    job_description: str

class ResumeJDRequest(BaseModel):
    resume_text: str
    job_description: str

class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    job_description: str

@app.get("/")
def home():
    return {
        "message": "AI Career Copilot Backend Running"
    }


# Resume Upload Endpoint
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    file_location = f"temp_{file.filename}"

    with open(file_location, "wb") as f:
        f.write(await file.read())

    extracted_text = extract_resume_text(file_location)

    return {
        "resume_text": extracted_text
    }


# JD Analysis Endpoint
@app.post("/analyze-jd")
def analyze_jd(data: JDRequest):

    prompt = f"""
You are an expert recruiter and career coach.

Analyze the following job description.

Return ONLY valid JSON.

Format:

{{
  "required_skills": [],
  "hidden_expectations": [],
  "interview_topics": [],
  "preparation_questions": [],
  "study_topics": [],
  "high_risk_areas": [],
  "priority_topics": []
}}

Rules:
- Each field must contain concise bullet points
- No markdown
- No explanations outside JSON
- No extra text

Job Description:
{data.job_description}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert recruiter and career coach."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    parsed_response = json.loads(
        response.choices[0].message.content
    )

    print(parsed_response)

    return parsed_response

@app.post("/compare-resume-jd")
def compare_resume_jd(data: ResumeJDRequest):

    prompt = f"""
You are an experienced senior hiring manager interviewing this candidate for the role.

Do NOT summarize the resume.

Your task is to critically evaluate the candidate.

Think like a skeptical technical interviewer.

Analyze:
- what experience appears weak or shallow
- what recruiter concerns exist
- what the resume FAILS to prove
- which JD expectations are insufficiently demonstrated
- Technical depth concerns: identify areas where the candidate's resume looks shallow, incomplete, or vulnerable to deeper technical questioning. Explain what interviewers may probe further and why. Do NOT list generic skills.
- Hidden role expectations: infer unstated expectations recruiters and hiring managers likely have based on the JD, role seniority, tech stack, and industry norms. Focus on ownership, execution, communication, reliability, production thinking, and collaboration.
- what security/compliance gaps are visible
- which resume bullets sound generic or low-impact
- how the candidate could better position existing experience

Avoid generic observations.

Provide deep recruiter insight.

Return ONLY valid JSON.

Format:

{{
  "detected_role": "",
  "initial_ats_score": 0,
  "initial_ats_reasoning": [],
  "top_strengths": [],
  "critical_gaps": [],
  "recruiter_concerns": [],
  "likely_rejection_reasons": [],
  "technical_depth_concerns": [],
  "hidden_role_expectations": [],
  "resume_bullet_improvements": [],
  "high_priority_study_areas": [],
  "likely_interviewer_focus_areas": []
  "scenario_based_questions": []
}}

Rules:
- Be brutally realistic
- Think deeply
- Avoid repeating resume content
- First identify the target role/domain from the JD, such as Java backend, frontend, data science, DevOps, cloud, cybersecurity, AI/ML, product, business analyst, QA, or other.
- All gaps, concerns, resume improvements, study areas, and scenario questions MUST be specific to that identified role.
- Do NOT generate DevOps, cloud, Kubernetes, security, or infrastructure questions unless the JD actually requires those areas.
- If the JD is for a Java role, focus on Java, Spring Boot, REST APIs, databases, OOP, system design, testing, concurrency, microservices, debugging, and backend engineering expectations.
- If the JD is for another role, adapt completely to that role.
- Avoid irrelevant technologies or interview topics not supported by the JD.
- Avoid generic ATS-style observations
- Focus on what is MISSING or weak
- Resume improvements should sound like strong recruiter-quality bullets
- Do not invent fake experience
- Focus heavily on interview readiness and recruiter perception
- No markdown
- No explanations outside JSON
- initial_ats_score should estimate the current resume-to-JD match from 0 to 100
- initial_ats_reasoning should explain the score using concise bullet points
- Base initial ATS score on keyword alignment, role relevance, experience depth, missing JD requirements, and resume clarity
- Do not inflate the score unrealistically
- For technical_depth_concerns, each item must explain WHY it is a concern, not just name a technology.
- For hidden_role_expectations, each item must describe an inferred expectation that is not directly stated in the JD.
- Avoid generic keyword lists.
- Write like a skeptical hiring manager giving useful private feedback.

Resume:
{data.resume_text}

Job Description:
{data.job_description}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior recruiter and interview strategist."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    parsed_response = json.loads(
        response.choices[0].message.content
    )

    return parsed_response

@app.post("/evaluate-answer")
def evaluate_answer(data: AnswerEvaluationRequest):

    prompt = f"""
You are a realistic but supportive interview evaluator.

Your job is to evaluate the candidate's answer honestly.

Important:
Do NOT automatically generate criticism.
Do NOT force a "better answer" if the candidate's answer is already strong.
First decide the actual quality of the answer.

Return ONLY valid JSON.

Format:

{{
  "answer_quality": "",
  "score": 0,
  "is_interview_ready": false,
  "strengths": [],
  "improvements": [],
  "missing_concepts": [],
  "better_answer": "",
  "follow_up_question": ""
}}

Evaluation rules:
- answer_quality must be one of: "weak", "decent", "strong", "excellent"
- score must be between 0 and 100
- If the answer is excellent, improvements can be minor and missing_concepts can be empty
- If the answer is excellent, better_answer should say: "Your answer is already strong. No major rewrite needed."
- If the answer is strong, only suggest small polish improvements
- If the answer is weak or vague, clearly explain what is missing
- Be honest, but motivating
- Do not be harsh
- Do not sugarcoat
- Evaluate based on role expectations from the job description
- Check for technical depth, clarity, structure, real-world thinking, and interview readiness
- Follow-up question should probe deeper only if useful

Job Description:
{data.job_description}

Interview Question:
{data.question}

Candidate Answer:
{data.answer}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a fair, realistic, and supportive interview evaluator."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    parsed_response = json.loads(
        response.choices[0].message.content
    )

    return parsed_response

@app.post("/generate-tailored-resume")
def generate_tailored_resume(data: ResumeJDRequest):

    prompt = f"""
You are an expert ATS analyst, technical recruiter, and resume strategist.

Your job is to tailor the candidate's resume for the target job description.

VERY IMPORTANT RULES:
- Do NOT invent fake experience
- Do NOT add technologies the candidate cannot justify
- Do NOT create fake projects
- Do NOT fabricate metrics
- Only optimize and reframe existing experience
- Improve recruiter alignment
- Improve ATS alignment
- Make bullets more impactful and structured
- Emphasize relevant experience for the target role

Return ONLY valid JSON.

Format:

{{
  "projected_ats_score_after_tailoring": 0,
  "ats_score_reasoning": [],
  "tailored_resume": ""
}}

ATS scoring rules:
- initial_ats_score should estimate how well the current resume aligns with the JD from 0 to 100
- projected_ats_score_after_tailoring should estimate improvement after applying the tailored resume changes
- Do not inflate scores unrealistically
- Base scores on keyword alignment, role relevance, experience depth, resume clarity, and missing JD requirements
- ats_score_reasoning should explain why the score increased or why it is limited

Resume tailoring rules:
- Generate a complete tailored resume based on the candidate's real resume
- The resume should be optimized for the JD
- Aim for ATS score above 85 if the candidate's real experience supports it
- Do NOT invent fake experience, fake tools, fake companies, fake projects, or fake metrics
- If a requirement is missing, reframe related real experience honestly
- The tailored_resume field should contain the full resume text with sections like:
  Contact
  Professional Summary
  Skills
  Professional Experience
  Projects
  Education
  Certifications
- Make the resume clean, modern, and recruiter-friendly
- Do NOT include a Certifications section unless the original resume explicitly contains real certifications.
- Do NOT write planned, in progress, recommended, future, or suggested certifications.

Candidate Resume:
{data.resume_text}

Job Description:
{data.job_description}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an honest ATS analyst, recruiter, and resume strategist."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    parsed_response = json.loads(
        response.choices[0].message.content
    )

    tailored_resume = parsed_response.get("tailored_resume", "")

    blocked_certification_phrases = [
        "certifications in progress",
        "certification in progress",
        "certifications planned",
        "certification planned",
        "planned certifications",
        "relevant certifications in progress",
        "can be added when obtained",
        "details can be added when obtained",
    ]

    if any(phrase in tailored_resume.lower() for phrase in blocked_certification_phrases):
        lines = tailored_resume.split("\n")
        cleaned_lines = []
        skip_certifications = False

        for line in lines:
            clean_line = line.strip()

            if clean_line.upper() == "CERTIFICATIONS":
                skip_certifications = True
                continue

            if skip_certifications and clean_line.isupper() and clean_line:
                skip_certifications = False

            if not skip_certifications:
                cleaned_lines.append(line)

        parsed_response["tailored_resume"] = "\n".join(cleaned_lines).strip()

    return parsed_response

@app.post("/extract-jd-from-url")
async def extract_jd_from_url(data: dict):
    try:
        url = data.get("url")

        if not url:
            return {"error": "No URL provided"}

        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get(url, headers=headers)

        soup = BeautifulSoup(response.text, "html.parser")

        text = soup.get_text(separator=" ", strip=True)

        cleaned_text = " ".join(text.split())

        return {
            "job_description": cleaned_text[:12000]
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    
@app.post("/download-tailored-resume-docx")
def download_tailored_resume_docx(data: dict):
    tailored_resume = data.get("tailored_resume", "")

    file_id = str(uuid.uuid4())
    file_path = f"tailored_resume_{file_id}.docx"

    doc = Document()

    section = doc.sections[0]
    section.top_margin = Inches(0.45)
    section.bottom_margin = Inches(0.45)
    section.left_margin = Inches(0.6)
    section.right_margin = Inches(0.6)

    styles = doc.styles
    normal_style = styles["Normal"]
    normal_style.font.name = "Calibri"
    normal_style.font.size = Pt(10.5)

    section_titles = [
        "PROFESSIONAL SUMMARY",
        "SUMMARY",
        "CORE COMPETENCIES",
        "SKILLS",
        "TECHNICAL SKILLS",
        "PROFESSIONAL EXPERIENCE",
        "WORK EXPERIENCE",
        "EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "CERTIFICATIONS",
    ]

    lines = tailored_resume.split("\n")

    for index, line in enumerate(lines):
        clean_line = line.strip()

        if not clean_line:
            continue

        if index == 0:
            p = doc.add_paragraph()
            p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            p.paragraph_format.space_after = Pt(2)

            run = p.add_run(clean_line.upper())
            run.bold = True
            run.font.size = Pt(20)
            run.font.color.rgb = RGBColor(17, 24, 39)
            continue

        if index == 1 and ("@" in clean_line or "|" in clean_line):
            p = doc.add_paragraph()
            p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            p.paragraph_format.space_after = Pt(8)

            run = p.add_run(clean_line)
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(75, 85, 99)

            add_horizontal_line(p)

            continue

        if clean_line.upper() in section_titles:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)

            run = p.add_run(clean_line.upper())
            run.bold = True
            run.font.size = Pt(11.5)
            run.font.color.rgb = RGBColor(37, 99, 235)

            add_horizontal_line(p)
            continue

        if clean_line.startswith("-") or clean_line.startswith("•"):
          p = doc.add_paragraph(style="List Bullet")
          p.paragraph_format.left_indent = Inches(0.28)
          p.paragraph_format.space_after = Pt(3.5)

          run = p.add_run(clean_line.lstrip("-• ").strip())
          run.font.size = Pt(10)
          run.font.color.rgb = RGBColor(31, 41, 55)
          continue

        is_role_line = (
            " | " in clean_line
            or " — " in clean_line
            or " - " in clean_line and any(char.isdigit() for char in clean_line)
        )

        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)

        run = p.add_run(clean_line)
        run.font.size = Pt(10.5)

        if is_role_line:
         run.bold = True
         run.font.size = Pt(11)
         run.font.color.rgb = RGBColor(17, 24, 39)
         p.paragraph_format.space_before = Pt(5)
         p.paragraph_format.space_after = Pt(2)
    else:
         run.font.color.rgb = RGBColor(31, 41, 55)

    doc.save(file_path)

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="tailored_resume.docx"
    )

@app.post("/download-tailored-resume-pdf")
def download_tailored_resume_pdf(data: dict):
    tailored_resume = data.get("tailored_resume", "")

    file_id = str(uuid.uuid4())
    file_path = f"tailored_resume_{file_id}.pdf"

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=42,
        leftMargin=42,
        topMargin=34,
        bottomMargin=34,
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "NameStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        alignment=TA_CENTER,
        textColor="#111827",
        spaceAfter=4,
    )

    contact_style = ParagraphStyle(
        "ContactStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=11,
        alignment=TA_CENTER,
        textColor="#4B5563",
        spaceAfter=10,
    )

    heading_style = ParagraphStyle(
        "HeadingStyle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.8,
        leading=13,
        textColor="#2563EB",
        spaceBefore=9,
        spaceAfter=4,
    )

    normal_style = ParagraphStyle(
        "NormalResumeStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=11.8,
        textColor="#1F2937",
        spaceAfter=4.5,
    )

    role_style = ParagraphStyle(
        "RoleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12.5,
        textColor="#111827",
        spaceBefore=6,
        spaceAfter=3,
    )

    bullet_style = ParagraphStyle(
        "BulletResumeStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.1,
        leading=11.5,
        textColor="#1F2937",
        leftIndent=13,
        firstLineIndent=-7,
        spaceAfter=4.5,
    )

    story = []

    section_titles = [
        "PROFESSIONAL SUMMARY",
        "SUMMARY",
        "CORE COMPETENCIES",
        "SKILLS",
        "TECHNICAL SKILLS",
        "PROFESSIONAL EXPERIENCE",
        "WORK EXPERIENCE",
        "EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "CERTIFICATIONS",
    ]

    lines = tailored_resume.split("\n")

    for index, line in enumerate(lines):
        clean_line = line.strip()

        if not clean_line:
            story.append(Spacer(1, 4))
            continue

        safe_line = (
            clean_line
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        if index == 0:
            story.append(Paragraph(f"<b>{safe_line.upper()}</b>", name_style))
            continue

        if index == 1 and ("@" in clean_line or "|" in clean_line):
            story.append(Paragraph(safe_line, contact_style))
            continue

        if clean_line.upper() in section_titles:
            story.append(Paragraph(f"<b>{safe_line.upper()}</b>", heading_style))

            story.append(
                HRFlowable(
                    width="100%",
                    thickness=1,
                    color="#D1D5DB",
                    spaceBefore=2,
                    spaceAfter=6,
                )
            )

            continue

        if clean_line.startswith("-") or clean_line.startswith("•"):
            bullet_text = safe_line.lstrip("-• ").strip()
            story.append(Paragraph(f"• {bullet_text}", bullet_style))
            continue

        is_role_line = (
            " | " in clean_line
            or " — " in clean_line
            or (" - " in clean_line and any(char.isdigit() for char in clean_line))
        )

        if is_role_line:
            story.append(Paragraph(safe_line, role_style))
        else:
            story.append(Paragraph(safe_line, normal_style))


    doc.build(story)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename="tailored_resume.pdf"
    )
