// Test file for Gemini Service Integration
// This file demonstrates how to use the Gemini service

import geminiService from "./geminiService";

// Example usage and test cases
export const testGeminiIntegration = async () => {
  console.log("🧪 Testing Gemini Form Generation Integration");

  const testCases = [
    {
      description: "Create a registration form with company and designation",
      expectedFields: ["Company", "Designation"], // Should use PRESET fields
    },
    {
      description: "Build a contact form with name, email, and phone",
      expectedFields: ["Name", "Email", "Phone"], // Should use PRESET fields
    },
    {
      description: "How satisfied are you with our service?",
      expectedFields: ["Service Satisfaction"], // Should use SELECT with rating options
    },
    {
      description: "What is your age group?",
      expectedFields: ["Age Group"], // Should use SELECT with age ranges
    },
    {
      description: "Which department do you work in?",
      expectedFields: ["Department"], // Should use SELECT with department options
    },
    {
      description: "Are you interested in our newsletter?",
      expectedFields: ["Newsletter Interest"], // Should use SELECT with Yes/No
    },
    {
      description: "Please share your feedback about the event",
      expectedFields: ["Event Feedback"], // Should use TEXTAREA
    },
    {
      description: "How many years of experience do you have?",
      expectedFields: ["Years of Experience"], // Should use NUMBER
    },
    {
      description: "What is your preferred contact time?",
      expectedFields: ["Preferred Contact Time"], // Should use TIME or SELECT
    },
    {
      description: "Please upload your resume",
      expectedFields: ["Resume"], // Should use FILE
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Testing: "${testCase.description}"`);

      const fields = await geminiService.generateFormFields(testCase.description);

      console.log(
        "✅ Generated fields:",
        fields.map((f) => f.label)
      );
      console.log("📊 Field count:", fields.length);
      console.log(
        "🔍 Field types:",
        fields.map((f) => `${f.label} (${f.type})`)
      );

      // Validate that we got some fields
      if (fields.length === 0) {
        console.log("❌ No fields generated");
      } else {
        console.log("✅ Fields generated successfully");
      }
    } catch (error) {
      console.error("❌ Test failed:", error.message);
    }
  }
};

// Example of how to use the service in a React component
export const exampleUsage = `
// In your React component:

import { useState } from 'react';
import geminiService from '../services/geminiService';

const FormBuilder = () => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFields, setGeneratedFields] = useState([]);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      const fields = await geminiService.generateFormFields(description);
      setGeneratedFields(fields);
    } catch (error) {
      console.error('Failed to generate fields:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the form you want to create..."
      />
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Form'}
      </button>

      {generatedFields.map((field, index) => (
        <div key={index}>
          <strong>{field.label}</strong> ({field.type})
          {field.required && ' *'}
        </div>
      ))}
    </div>
  );
};

// EXAMPLE PROMPTS SHOWING INTELLIGENT FIELD TYPE SELECTION:

// ✅ PRESET Fields (when keywords match):
"Create a form with company and designation" → Company (text) + Designation (text)
"Build a contact form with name, email, and phone" → Name (text) + Email (email) + Phone (mobilenumber)

// ✅ INTELLIGENT Select Fields with Auto-Generated Options:
"How satisfied are you with our service?" → Service Satisfaction (select) with ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
"What is your age group?" → Age Group (select) with ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
"Which department do you work in?" → Department (select) with ["HR", "IT", "Sales", "Marketing", "Finance", "Operations"]
"Are you interested in our newsletter?" → Newsletter Interest (select) with ["Yes", "No"]

// ✅ INTELLIGENT Field Type Selection:
"Please share your feedback about the event" → Event Feedback (textarea)
"How many years of experience do you have?" → Years of Experience (number)
"What is your preferred contact time?" → Preferred Contact Time (time)
"Please upload your resume" → Resume (file)

// ✅ MIXED Usage (preset + intelligent):
"Create a registration form with company and satisfaction rating"
→ Company (text) + Satisfaction Rating (select) with rating options
`;

// Environment setup instructions
export const setupInstructions = `
🔧 SETUP INSTRUCTIONS:

1. Get your Gemini API key from Google AI Studio:
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the API key

2. Add to your environment variables:
   - Create .env file in your project root
   - Add: VITE_GEMINI_API_KEY=your_api_key_here

3. Make sure the API key has proper permissions:
   - The key should have access to Gemini 2.0 Flash model
   - Check your Google Cloud Console for any restrictions

4. Test the integration:
   - Import and run testGeminiIntegration()
   - Check browser console for results

📝 EXAMPLE PROMPTS TO TRY:

"Create a registration form for a business conference with fields for participant details"
"Build a contact form with name, email, phone, and message fields"
"Make a survey form for event feedback with rating and comments"
"Create a job application form with personal info and qualifications"
"Build a newsletter signup form with preferences"

🚨 TROUBLESHOOTING:

- If you get API key errors, check your .env file and key validity
- If network errors occur, verify your internet connection
- If parsing errors happen, the fallback keyword system will activate
- Check browser console for detailed error messages
`;

// Demonstration of intelligent field type selection
export const demonstrateIntelligentSelection = () => {
  console.log("🧠 Demonstrating Intelligent Field Type Selection");

  const examples = [
    {
      input: "How satisfied are you with our service?",
      analysis: "Question asks for satisfaction level → SELECT field with rating options",
      expectedOutput: {
        label: "Service Satisfaction",
        type: "select",
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      },
    },
    {
      input: "What is your age group?",
      analysis: "Question asks for age category → SELECT field with age ranges",
      expectedOutput: {
        label: "Age Group",
        type: "select",
        options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
      },
    },
    {
      input: "Please share your feedback about the event",
      analysis: "Requests detailed feedback → TEXTAREA field",
      expectedOutput: {
        label: "Event Feedback",
        type: "textarea",
        placeholder: "Please share your feedback about the event...",
      },
    },
    {
      input: "How many years of experience do you have?",
      analysis: "Asks for numerical value → NUMBER field",
      expectedOutput: {
        label: "Years of Experience",
        type: "number",
        placeholder: "Enter number of years",
      },
    },
    {
      input: "Are you interested in our newsletter?",
      analysis: "Yes/No question → SELECT field with Yes/No options",
      expectedOutput: {
        label: "Newsletter Interest",
        type: "select",
        options: ["Yes", "No"],
      },
    },
  ];

  examples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.input}`);
    console.log(`   Analysis: ${example.analysis}`);
    console.log(`   Expected: ${example.expectedOutput.type} field`);
    if (example.expectedOutput.options) {
      console.log(`   Options: [${example.expectedOutput.options.join(", ")}]`);
    }
  });

  console.log("\n🎯 The AI now intelligently analyzes each question and selects the most appropriate field type!");
};

// Export for use in other files
export default {
  testGeminiIntegration,
  exampleUsage,
  setupInstructions,
  demonstrateIntelligentSelection,
};
