// Standard survey phases for regulatory surveys
export const SURVEY_PHASES = [
  {
    id: "pre-survey",
    name: "Pre-Survey Requirements / Offsite Preparation",
    description: "Review documents and prepare for the survey",
    order: 1
  },
  {
    id: "entrance",
    name: "Entrance Procedures",
    description: "Initial meeting and facility tour",
    order: 2
  },
  {
    id: "initial-pool",
    name: "Initial Pool Selection",
    description: "Select residents for survey sample",
    order: 3
  },
  {
    id: "final-sample",
    name: "Final Sample Selection",
    description: "Finalize resident selection",
    order: 4
  },
  {
    id: "resident-investigations",
    name: "Resident Investigations",
    description: "Investigate selected residents",
    order: 5
  },
  {
    id: "mandatory-tasks",
    name: "Mandatory Facility Tasks",
    description: "Required facility inspections and checks",
    order: 6
  },
  {
    id: "interviews",
    name: "Interviews",
    description: "Conduct interviews with staff and residents",
    order: 7
  },
  {
    id: "team-meetings",
    name: "Team Meetings",
    description: "Survey team coordination meetings",
    order: 8
  },
  {
    id: "findings-draft",
    name: "Findings & Citations Draft",
    description: "Draft findings and potential citations",
    order: 9
  },
  {
    id: "exit-conference",
    name: "Exit Conference",
    description: "Final meeting with facility leadership",
    order: 10
  },
  {
    id: "final-report",
    name: "Final Survey Report",
    description: "Compile final survey report",
    order: 11
  },
  {
    id: "plan-of-correction",
    name: "Plan of Correction",
    description: "Facility submits plan to address deficiencies",
    order: 12
  },
  {
    id: "survey-closure",
    name: "Survey Closure",
    description: "Close out the survey",
    order: 13
  }
]

// Form field types for drag-and-drop builder
export const FORM_FIELD_TYPES = [
  {
    id: "text",
    name: "Text Input",
    icon: "📝",
    description: "Single-line text input",
    component: "input",
    defaultConfig: {
      placeholder: "Enter text...",
      required: false
    }
  },
  {
    id: "textarea",
    name: "Textarea",
    icon: "📄",
    description: "Multi-line text input",
    component: "textarea",
    defaultConfig: {
      placeholder: "Enter text...",
      rows: 4,
      required: false
    }
  },
  {
    id: "checkbox",
    name: "Checkbox",
    icon: "☑️",
    description: "Checkbox (Yes/No)",
    component: "checkbox",
    defaultConfig: {
      label: "Yes",
      required: false
    }
  },
  {
    id: "radio",
    name: "Radio Button",
    icon: "🔘",
    description: "Single choice from options",
    component: "radio",
    defaultConfig: {
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" }
      ],
      required: false
    }
  },
  {
    id: "date",
    name: "Date Picker",
    icon: "📅",
    description: "Date selection",
    component: "date",
    defaultConfig: {
      required: false
    }
  },
  {
    id: "file",
    name: "File Upload",
    icon: "📎",
    description: "Upload file or photo",
    component: "file",
    defaultConfig: {
      accept: "image/*,.pdf,.doc,.docx",
      required: false
    }
  },
  {
    id: "number",
    name: "Number Input",
    icon: "🔢",
    description: "Numeric input",
    component: "number",
    defaultConfig: {
      placeholder: "Enter number...",
      required: false
    }
  },
  {
    id: "select",
    name: "Dropdown",
    icon: "📋",
    description: "Select from dropdown",
    component: "select",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" }
      ],
      required: false
    }
  }
]

