// js/data.js
export const mainNodes = [
  { id: "m1", type: "main", title: "A Business Exists", y: window.innerHeight/2, desc: "Foundational assumption: a business exists as an entity that provides value in exchange for resources.", role: "human" },
  { id: "m2", type: "main", title: "Scans for Unmet Need / Opportunity", y: window.innerHeight/2, desc: "The business actively looks for things it can improve, fix, or create.", role: "hybrid" },
  { id: "m3", type: "main", title: "Selects Worthwhile Opportunities", y: window.innerHeight/2, desc: "Determines which discovered needs or opportunities are realistic, aligned with the business, and worth pursuing.", role: "hybrid" },
  { id: "m4", type: "main", title: "Prepares Selected Opportunities for Execution", y: window.innerHeight/2, desc: "Transitions a selected opportunity into a defined, actionable structure the business can begin working on.", role: "hybrid" },
  { id: "m5", type: "main", title: "Transfers Prepared Work to Executers", y: window.innerHeight/2, desc: "Transfers fully prepared opportunities to the department, team, or individual best suited to execute them.", role: "hybrid" },
  { id: "m6", type: "main", title: "Executes Work", y: window.innerHeight/2, desc: "The assigned department or role carries out the necessary actions to fulfill the opportunity.", role: "hybrid" },
  { id: "m7", type: "main", title: "Reviews and Approves Work Internally", y: window.innerHeight/2, desc: "The completed work is submitted for internal review to ensure it meets quality and compliance standards.", role: "hybrid" },
  { id: "m8", type: "main", title: "Finalizes and Delivers the Output", y: window.innerHeight/2, desc: "The approved work is finalized into its completed form and delivered to the intended recipient.", role: "hybrid" },
  { id: "m9", type: "main", title: "Reflects and Learns", y: window.innerHeight/2, desc: "After delivery, the business analyzes results and identifies improvement areas.", role: "hybrid" },
  { id: "m10", type: "main", title: "Scans for Unmet Need / Opportunity", y: window.innerHeight/2, desc: "The business actively looks for things it can improve, fix, or create.", role: "hybrid" }
];

export const subNodes = [
  // Sub nodes for main node 2:
  { id: "m2s1", type: "sub", title: "Conducts Market Research", desc: "Actively seeks to understand customer needs.", role: "hybrid" },
  { id: "m2s2", type: "sub", title: "Observes Trends & Behaviors", desc: "Watches how trends evolve in the market.", role: "hybrid" },
  { id: "m2s3", type: "sub", title: "Analyzes Technology & Process Landscape", desc: "Explores current tools and processes for improvement.", role: "hybrid" },
  // Sub nodes for main node 4:
  { id: "m4s1", type: "sub", title: "Categorize the Opportunity", desc: "Determines the type of opportunity.", role: "ai" },
  { id: "m4s2", type: "sub", title: "Define Scope and Objectives", desc: "Clarifies what is included and what success looks like.", role: "hybrid" },
  { id: "m4s3", type: "sub", title: "Allocate Resources and Roles", desc: "Assigns the needed people, tools, and budget.", role: "hybrid" },
  { id: "m4s4", type: "sub", title: "Draft Initial Plan or Workflow", desc: "Creates a rough outline to guide execution.", role: "ai" },
  { id: "m4s5", type: "sub", title: "Identify Risks and Constraints", desc: "Highlights potential blockers and limitations.", role: "ai" },
  { id: "m4s6", type: "sub", title: "Confirm Stakeholder Expectations", desc: "Ensures all parties are aligned.", role: "human" },
  { id: "m4s7", type: "sub", title: "Set Success Criteria", desc: "Defines when the opportunity is successfully addressed.", role: "human" },
  // Sub nodes for main node 6:
  { id: "m6s1", type: "sub", title: "Gathers or Receives Required Inputs", desc: "Collects necessary data or materials.", role: "ai" },
  { id: "m6s2", type: "sub", title: "Performs Core Tasks", desc: "Carries out the main functions needed.", role: "hybrid" },
  { id: "m6s3", type: "sub", title: "Collaborates Across Roles or Tools", desc: "Coordinates with other systems or teams.", role: "hybrid" },
  { id: "m6s4", type: "sub", title: "Tracks Progress and Captures Output", desc: "Logs work and metrics.", role: "ai" },
  { id: "m6s5", type: "sub", title: "Verifies Self-Quality Before Handoff", desc: "Checks that work is complete and correct.", role: "hybrid" },
  // Sub nodes for main node 7:
  { id: "m7s1", type: "sub", title: "Conducts Quality Assurance", desc: "Checks work for defects and inconsistencies.", role: "hybrid" },
  { id: "m7s2", type: "sub", title: "Performs Peer or Cross-Team Review", desc: "Gathers feedback from colleagues.", role: "human" },
  { id: "m7s3", type: "sub", title: "Validates Against Original Requirements", desc: "Ensures deliverables meet defined criteria.", role: "hybrid" },
  { id: "m7s4", type: "sub", title: "Conducts Managerial or Final Sign-Off", desc: "Provides the final review and approval.", role: "human" },
  { id: "m7s5", type: "sub", title: "Logs Approval and Prepares for Handoff", desc: "Documents approval and readies delivery.", role: "ai" },
  // Sub nodes for main node 8:
  { id: "m8s1", type: "sub", title: "Finalizes Output for Delivery", desc: "Polishes the work into its final form.", role: "hybrid" },
  { id: "m8s2", type: "sub", title: "Selects Delivery Channel or Method", desc: "Chooses the best way to deliver the work.", role: "hybrid" },
  { id: "m8s3", type: "sub", title: "Delivers to Intended Recipient or System", desc: "Executes the delivery.", role: "ai" },
  { id: "m8s4", type: "sub", title: "Confirms Receipt and Acknowledgement", desc: "Verifies that the delivery was received.", role: "ai" },
  { id: "m8s5", type: "sub", title: "Archives Final Version or Proof of Delivery", desc: "Stores the final output for record keeping.", role: "ai" },
  // Sub nodes for main node 9:
  { id: "m9s1", type: "sub", title: "Collects Outcome Feedback", desc: "Gathers responses and performance data.", role: "ai" },
  { id: "m9s2", type: "sub", title: "Measures Against Success Criteria", desc: "Compares results to established goals.", role: "ai" },
  { id: "m9s3", type: "sub", title: "Identifies Strengths and Shortcomings", desc: "Analyzes what worked and what did not.", role: "ai" },
  { id: "m9s4", type: "sub", title: "Logs Learnings and Recommendations", desc: "Records insights for future reference.", role: "hybrid" },
  { id: "m9s5", type: "sub", title: "Updates Systems and Practices", desc: "Modifies processes based on lessons learned.", role: "human" }
];

export const subSubNodes = [
  // For sub node m2s1:
  { id: "m2s1ss1", type: "subsub", title: "Distributes Surveys / Runs Interviews", desc: "Collects firsthand insights.", role: "hybrid" },
  { id: "m2s1ss2", type: "subsub", title: "Analyzes Sales & Churn Data", desc: "Processes quantitative data.", role: "ai" },
  { id: "m2s1ss3", type: "subsub", title: "Reviews Competitor Feedback", desc: "Examines competitor strengths and weaknesses.", role: "hybrid" },
  // For sub node m2s2:
  { id: "m2s2ss1", type: "subsub", title: "Scrapes Forums / Social Platforms", desc: "Gathers online discussions.", role: "ai" },
  { id: "m2s2ss2", type: "subsub", title: "Watches Keyword & Search Trends", desc: "Monitors trending search data.", role: "ai" },
  { id: "m2s2ss3", type: "subsub", title: "Follows Consumer Habits", desc: "Tracks shifts in behavior.", role: "hybrid" },
  // For sub node m2s3:
  { id: "m2s3ss1", type: "subsub", title: "Tracks New APIs & Platforms", desc: "Identifies emerging technologies.", role: "ai" },
  { id: "m2s3ss2", type: "subsub", title: "Audits Standard Workflows", desc: "Reviews existing processes.", role: "ai" },
  { id: "m2s3ss3", type: "subsub", title: "Compares Operational Benchmarks", desc: "Measures performance against norms.", role: "ai" },
  // For sub node m4s1:
  { id: "m4s1ss1", type: "subsub", title: "Classifies by Business Function", desc: "Determines the relevant business area.", role: "ai" },
  { id: "m4s1ss2", type: "subsub", title: "Tags Complexity or Urgency", desc: "Labels the effort required.", role: "ai" },
  { id: "m4s1ss3", type: "subsub", title: "Matches with Historical Work Archetypes", desc: "Finds similar past projects.", role: "ai" },
  // For sub node m4s2:
  { id: "m4s2ss1", type: "subsub", title: "Clarifies Deliverables and Constraints", desc: "Outlines what must be delivered.", role: "hybrid" },
  { id: "m4s2ss2", type: "subsub", title: "Establishes Success Criteria", desc: "Defines measurable outcomes.", role: "hybrid" },
  { id: "m4s2ss3", type: "subsub", title: "Confirms Stakeholder Agreements", desc: "Verifies mutual consent.", role: "human" },
  // For sub node m4s3:
  { id: "m4s3ss1", type: "subsub", title: "Assigns Ownership and Responsibility", desc: "Determines who leads each task.", role: "human" },
  { id: "m4s3ss2", type: "subsub", title: "Confirms Tool Access and Permissions", desc: "Ensures necessary accesses are in place.", role: "ai" },
  { id: "m4s3ss3", type: "subsub", title: "Estimates Time and Budget Needs", desc: "Forecasts resource requirements.", role: "ai" },
  // For sub node m4s4:
  { id: "m4s4ss1", type: "subsub", title: "Outlines Major Phases or Milestones", desc: "Breaks work into segments.", role: "ai" },
  { id: "m4s4ss2", type: "subsub", title: "Maps Task Dependencies", desc: "Shows prerequisite relationships.", role: "ai" },
  { id: "m4s4ss3", type: "subsub", title: "Creates Visual or Written Workflow", desc: "Documents the execution path.", role: "ai" },
  // For sub node m4s5:
  { id: "m4s5ss1", type: "subsub", title: "Flags External Dependencies", desc: "Identifies outside requirements.", role: "ai" },
  { id: "m4s5ss2", type: "subsub", title: "Surfaces Legal, Compliance, or Policy Concerns", desc: "Highlights sensitive issues.", role: "human" },
  { id: "m4s5ss3", type: "subsub", title: "Identifies Known Technical Limitations", desc: "Notes current system constraints.", role: "ai" },
  // For sub node m4s6:
  { id: "m4s6ss1", type: "subsub", title: "Holds Kickoff or Alignment Meeting", desc: "Starts the project with team alignment.", role: "human" },
  { id: "m4s6ss2", type: "subsub", title: "Documents Commitments and Expectations", desc: "Records agreed-upon points.", role: "human" },
  { id: "m4s6ss3", type: "subsub", title: "Logs Stakeholder Sign-Off", desc: "Documents final approvals.", role: "human" },
  // For sub node m4s7:
  { id: "m4s7ss1", type: "subsub", title: "Chooses Leading & Lagging Metrics", desc: "Selects performance indicators.", role: "ai" },
  { id: "m4s7ss2", type: "subsub", title: "Creates Tracking or Dashboard Plan", desc: "Plans how to monitor progress.", role: "ai" },
  { id: "m4s7ss3", type: "subsub", title: "Aligns Metrics With Business Objectives", desc: "Ensures metrics reflect strategic goals.", role: "human" },
  // For sub node m6s1:
  { id: "m6s1ss1", type: "subsub", title: "Retrieves Instructions, Briefs, or Requirements", desc: "Pulls necessary documentation.", role: "ai" },
  { id: "m6s1ss2", type: "subsub", title: "Collects Materials, Data, or Assets", desc: "Gathers required inputs.", role: "ai" },
  { id: "m6s1ss3", type: "subsub", title: "Verifies Input Completeness and Accuracy", desc: "Checks data quality.", role: "ai" },
  // For sub node m6s2:
  { id: "m6s2ss1", type: "subsub", title: "Applies Skills or Tools to Deliver Output", desc: "Executes the core task.", role: "hybrid" },
  { id: "m6s2ss2", type: "subsub", title: "Follows Defined Workflow or Process", desc: "Adheres to the plan.", role: "ai" },
  { id: "m6s2ss3", type: "subsub", title: "Adapts to Unexpected Situations if Needed", desc: "Responds to unplanned challenges.", role: "human" },
  // For sub node m6s3:
  { id: "m6s3ss1", type: "subsub", title: "Hands Off Partial Work for Contribution", desc: "Transfers parts of work for input.", role: "human" },
  { id: "m6s3ss2", type: "subsub", title: "Uses Integrated Tools, APIs, or Workflows", desc: "Connects across systems.", role: "ai" },
  { id: "m6s3ss3", type: "subsub", title: "Communicates Status or Needs in Real Time", desc: "Shares updates instantly.", role: "ai" },
  // For sub node m6s4:
  { id: "m6s4ss1", type: "subsub", title: "Saves and Stores Work in Agreed Location", desc: "Archives the work.", role: "ai" },
  { id: "m6s4ss2", type: "subsub", title: "Updates Task or Project Management Systems", desc: "Logs current status.", role: "ai" },
  { id: "m6s4ss3", type: "subsub", title: "Records Key Metrics or Completion Data", desc: "Captures performance numbers.", role: "ai" },
  // For sub node m6s5:
  { id: "m6s5ss1", type: "subsub", title: "Cross-Checks Against Brief or Criteria", desc: "Verifies requirements are met.", role: "hybrid" },
  { id: "m6s5ss2", type: "subsub", title: "Runs Basic Tests or Validations", desc: "Performs simple checks.", role: "ai" },
  { id: "m6s5ss3", type: "subsub", title: "Makes Final Edits or Fixes", desc: "Adjusts minor issues.", role: "hybrid" },
  // For sub node m7s1:
  { id: "m7s1ss1", type: "subsub", title: "Checks for Errors, Omissions, or Defects", desc: "Scans for mistakes.", role: "ai" },
  { id: "m7s1ss2", type: "subsub", title: "Confirms Adherence to Internal Standards", desc: "Ensures compliance with standards.", role: "ai" },
  { id: "m7s1ss3", type: "subsub", title: "Tests Output in Relevant Environment", desc: "Validates functionality.", role: "ai" },
  // For sub node m7s2:
  { id: "m7s2ss1", type: "subsub", title: "Assigns Reviewer Not Involved in Execution", desc: "Selects an unbiased reviewer.", role: "human" },
  { id: "m7s2ss2", type: "subsub", title: "Collects Feedback and Suggested Changes", desc: "Gathers improvement ideas.", role: "human" },
  { id: "m7s2ss3", type: "subsub", title: "Iterates Based on Internal Collaboration", desc: "Revises work based on input.", role: "human" },
  // For sub node m7s3:
  { id: "m7s3ss1", type: "subsub", title: "Cross-References Output with Scope or Brief", desc: "Checks work against expectations.", role: "hybrid" },
  { id: "m7s3ss2", type: "subsub", title: "Checks All Success Criteria Are Met", desc: "Verifies key goals are achieved.", role: "ai" },
  { id: "m7s3ss3", type: "subsub", title: "Identifies Gaps or Overlooked Elements", desc: "Finds missing pieces.", role: "ai" },
  // For sub node m7s4:
  { id: "m7s4ss1", type: "subsub", title: "Escalates Work for Final Authority Review", desc: "Sends work up the chain.", role: "human" },
  { id: "m7s4ss2", type: "subsub", title: "Assesses Strategic or Client Alignment", desc: "Ensures strategic fit.", role: "human" },
  { id: "m7s4ss3", type: "subsub", title: "Signs Off or Requests Final Adjustments", desc: "Gives final approval or feedback.", role: "human" },
  // For sub node m7s5:
  { id: "m7s5ss1", type: "subsub", title: "Marks Work as Approved in Tracking System", desc: "Updates status to approved.", role: "ai" },
  { id: "m7s5ss2", type: "subsub", title: "Packages Deliverables for Final Delivery", desc: "Prepares assets for handoff.", role: "ai" },
  { id: "m7s5ss3", type: "subsub", title: "Coordinates Handoff Timing and Channel", desc: "Synchronizes the transfer.", role: "ai" },
  // For sub node m8s1:
  { id: "m8s1ss1", type: "subsub", title: "Applies Final Formatting or Cleanup", desc: "Polishes the final output.", role: "ai" },
  { id: "m8s1ss2", type: "subsub", title: "Converts Output into Required Format", desc: "Transforms the work into the needed format.", role: "ai" },
  { id: "m8s1ss3", type: "subsub", title: "Runs Last Check Before Packaging", desc: "Performs a final review.", role: "hybrid" },
  // For sub node m8s2:
  { id: "m8s2ss1", type: "subsub", title: "Evaluates Recipient’s Needs and Preferences", desc: "Assesses the best delivery approach.", role: "human" },
  { id: "m8s2ss2", type: "subsub", title: "Chooses Secure and Efficient Method", desc: "Selects a safe delivery method.", role: "ai" },
  { id: "m8s2ss3", type: "subsub", title: "Prepares Channel for Use", desc: "Gets the delivery channel ready.", role: "ai" },
  // For sub node m8s3:
  { id: "m8s3ss1", type: "subsub", title: "Executes Transfer or Submission", desc: "Carries out the transfer.", role: "ai" },
  { id: "m8s3ss2", type: "subsub", title: "Includes Necessary Instructions or Context", desc: "Adds guidance with the delivery.", role: "hybrid" },
  { id: "m8s3ss3", type: "subsub", title: "Ensures Access is Granted and Live", desc: "Verifies that delivery is accessible.", role: "ai" },
  // For sub node m8s4:
  { id: "m8s4ss1", type: "subsub", title: "Notifies Stakeholder of Completion", desc: "Sends a completion alert.", role: "ai" },
  { id: "m8s4ss2", type: "subsub", title: "Requests or Monitors Confirmation", desc: "Watches for confirmation.", role: "ai" },
  { id: "m8s4ss3", type: "subsub", title: "Follows Up If Delivery Unacknowledged", desc: "Reaches out if needed.", role: "ai" },
  // For sub node m8s5:
  { id: "m8s5ss1", type: "subsub", title: "Saves Deliverable to Long-Term Storage", desc: "Archives the delivery.", role: "ai" },
  { id: "m8s5ss2", type: "subsub", title: "Logs Delivery Timestamp and Method", desc: "Records delivery details.", role: "ai" },
  { id: "m8s5ss3", type: "subsub", title: "Backs Up Files or Output Securely", desc: "Creates a secure backup.", role: "ai" },
  // For sub node m9s1:
  { id: "m9s1ss1", type: "subsub", title: "Distributes Feedback Requests or Surveys", desc: "Initiates feedback collection.", role: "ai" },
  { id: "m9s1ss2", type: "subsub", title: "Monitors Organic Feedback Channels", desc: "Observes natural feedback flows.", role: "ai" },
  { id: "m9s1ss3", type: "subsub", title: "Aggregates Quantitative & Qualitative Responses", desc: "Combines different feedback types.", role: "ai" },
  // For sub node m9s2:
  { id: "m9s2ss1", type: "subsub", title: "Revisits Goals Defined During Preparation", desc: "Brings back the original targets.", role: "human" },
  { id: "m9s2ss2", type: "subsub", title: "Compiles Post-Delivery Metrics or Logs", desc: "Collects performance data.", role: "ai" },
  { id: "m9s2ss3", type: "subsub", title: "Compares Results to Benchmarks or Thresholds", desc: "Measures outcomes against standards.", role: "ai" },
  // For sub node m9s3:
  { id: "m9s3ss1", type: "subsub", title: "Runs Internal Team Debrief", desc: "Leads a reflective discussion.", role: "human" },
  { id: "m9s3ss2", type: "subsub", title: "Surfaces Process or Communication Breakdowns", desc: "Identifies where things went wrong.", role: "human" },
  { id: "m9s3ss3", type: "subsub", title: "Highlights High-Impact Success Factors", desc: "Points out what drove success.", role: "human" },
  // For sub node m9s4:
  { id: "m9s4ss1", type: "subsub", title: "Writes Up Lessons Learned Summary", desc: "Documents key takeaways.", role: "hybrid" },
  { id: "m9s4ss2", type: "subsub", title: "Links Outcomes to Specific Actions or Decisions", desc: "Connects results with causes.", role: "hybrid" },
  { id: "m9s4ss3", type: "subsub", title: "Tags Learnings for Future Retrieval", desc: "Makes insights easily searchable.", role: "ai" },
  // For sub node m9s5:
  { id: "m9s5ss1", type: "subsub", title: "Improves Documentation or Templates", desc: "Updates reference materials.", role: "ai" },
  { id: "m9s5ss2", type: "subsub", title: "Implements New Tools or Adjustments", desc: "Introduces changes to boost efficiency.", role: "ai" },
  { id: "m9s5ss3", type: "subsub", title: "Shares Improvements with the Org", desc: "Communicates enhancements to the team.", role: "human" }
];
