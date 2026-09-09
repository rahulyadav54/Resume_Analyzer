import type { JobTemplate } from "@/types";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "tpl_aiml",
    name: "AI/ML Engineer",
    department: "Engineering",
    requiredSkills: ["python", "machine learning", "sql", "scikit-learn", "pandas"],
    preferredSkills: ["docker", "aws", "nlp"],
    experience: "1–3 years",
    education: "B.Tech / M.Tech CS",
    scoringWeights: { ...DEFAULT_WEIGHTS },
    description:
      "Build and deploy machine learning models for production use cases.",
  },
  {
    id: "tpl_python",
    name: "Python Developer",
    department: "Engineering",
    requiredSkills: ["python", "fastapi", "sql", "git", "rest api"],
    preferredSkills: ["docker", "aws"],
    experience: "1–4 years",
    education: "Bachelor's in CS",
    scoringWeights: { ...DEFAULT_WEIGHTS, requiredSkills: 40, experience: 25 },
    description: "Develop backend services and APIs using Python.",
  },
  {
    id: "tpl_frontend",
    name: "Frontend Developer",
    department: "Product",
    requiredSkills: ["react", "typescript", "javascript", "html", "css"],
    preferredSkills: ["next.js", "tailwind"],
    experience: "1–3 years",
    education: "B.Tech IT / CSE",
    scoringWeights: { ...DEFAULT_WEIGHTS },
    description: "Build product interfaces with modern frontend tooling.",
  },
  {
    id: "tpl_data",
    name: "Data Analyst",
    department: "Analytics",
    requiredSkills: ["sql", "excel", "power bi", "python", "data analysis"],
    preferredSkills: ["tableau", "pandas"],
    experience: "0–2 years",
    education: "Bachelor's degree",
    scoringWeights: { ...DEFAULT_WEIGHTS },
    description: "Analyze datasets and deliver dashboards for decision-makers.",
  },
];
