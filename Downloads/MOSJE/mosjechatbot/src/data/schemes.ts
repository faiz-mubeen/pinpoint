export interface SchemeInfo {
  id: string;
  name: string;
  hindiName: string;
  shortCode: string;
  category: 'NGO' | 'SC' | 'Senior Citizens' | 'Scholarships' | 'Sanitation' | 'Transgender/Beggary' | 'Helpline' | 'De-addiction';
  officialUrl: string;
  helpline: string;
  objective: string;
  eligibility: string;
  benefits: string;
  referenceQuestions: string[];
}

export const MOSJE_SCHEMES: SchemeInfo[] = [
  {
    id: "e-anudaan",
    name: "e-ANUDAAN (NGO GIA Proposal System)",
    hindiName: "ई-अनुदान (गैर सरकारी संगठन सहायता अनुदान प्रस्ताव प्रणाली)",
    shortCode: "e-ANUDAAN",
    category: "NGO",
    officialUrl: "https://e-anudaan.nic.in/",
    helpline: "011-23386313 / support-msje@nic.in",
    objective: "To enable voluntary organizations (NGOs) to apply online for Grant-in-Aid under various social welfare schemes transparently and track their application life cycle in real-time.",
    eligibility: "Registered NGOs, Voluntary Organisations (VOs), Charitable Societies, or Registered Trusts with at least 2 years of active service, owning an active Unique ID from NGO Darpan portal (NITI Aayog).",
    benefits: "Direct online application processing, papers-less verification, automated updates, transparent sanctioning of grants, and direct bank account transfers of aid.",
    referenceQuestions: [
      "What are the pre-requisites for enrolling an NGO on the e-ANUDAAN portal?",
      "How can an NGO track its GIA proposal on e-ANUDAAN?",
      "Which welfare schemes receive Grant-in-Aid through e-ANUDAAN?"
    ]
  },
  {
    id: "nmba",
    name: "Nasha Mukt Bharat Abhiyaan (Drug-Free India Campaign)",
    hindiName: "नशा मुक्त भारत अभियान",
    shortCode: "NMBA",
    category: "De-addiction",
    officialUrl: "https://nmba.dosje.gov.in/",
    helpline: "1800-11-0031 (De-addiction Helpline)",
    objective: "To run a massive countrywide awareness campaign targeting vulnerable districts, mobilizing communities, empowering youth, and providing treatment resources to build a drug-abuse free nation.",
    eligibility: "All citizens of India, with special target focus on youth, educational institutions, women, and high-risk substance abuse districts.",
    benefits: "Counseling support, outreach events, drug-free school/college campus audits, access to 500+ de-addiction and counseling centers, and institutional rehabilitation referral.",
    referenceQuestions: [
      "What is Nasha Mukt Bharat Abhiyaan (NMBA)?",
      "Which districts are covered under NMBA and what are its key pillars?",
      "How can my educational institution participate in Nasha Mukt NMBA campaigns?"
    ]
  },
  {
    id: "pm-ajay",
    name: "Pradhan Mantri Anushuchit Jaati Abhyuday Yojana",
    hindiName: "प्रधानमंत्री अनुसूचित जाति अभ्युदय योजना",
    shortCode: "PM-AJAY",
    category: "SC",
    officialUrl: "https://pm-ajay.dosje.gov.in/",
    helpline: "011-23382343 (MoSJE SC Division)",
    objective: "An integrated scheme targeting reduction of poverty among Scheduled Caste (SC) communities. Merges PM Adarsh Gram Yojana (PMAGY), Special Central Assistance (SCA to SCSP), and Babe Jagjivan Ram Chhatrawas Yojana.",
    eligibility: "Individuals belonging to Scheduled Caste (SC) communities, and villages having more than 50% Scheduled Caste population.",
    benefits: "Financial assistance for income-generating activities up to ₹50,000 per beneficiary, construction of basic infrastructure in SC-dominated villages, and building hostels for SC boys and girls.",
    referenceQuestions: [
      "What are the three merged components of the PM-AJAY scheme?",
      "How are villages transformed into model villages (Adarsh Gram) under PM-AJAY?",
      "Who is eligible for financial grants for skill development under PM-AJAY?"
    ]
  },
  {
    id: "ageing-dignity",
    name: "Ageing with Dignity (Atal Vayo Abhyuday Yojana)",
    hindiName: "गरीमापूर्ण वृद्धावस्था (अटल वयो अभ्युदय योजना - AVYAY)",
    shortCode: "AVYAY",
    category: "Senior Citizens",
    officialUrl: "http://socialjustice.gov.in/",
    helpline: "14567 (Elder Line - National Helpline)",
    objective: "An umbrella scheme to provide quality healthcare, shelter, nutrition, security, emotional support, and active ageing opportunities to senior citizens of India.",
    eligibility: "Senior citizens of India (aged 60 and above), particularly destitute, indigent, or low-income elderly individuals.",
    benefits: "Support for running Senior Citizen Homes (old age homes), Continuous Care Homes, mobile medical units, and distribution of physical assisted-living devices for those with age-related disabilities.",
    referenceQuestions: [
      "What is Atal Vayo Abhyuday Yojana (AVYAY)?",
      "What services are funded for running Senior Citizen Homes (Old Age Homes)?",
      "Which assisted living devices are provided to poor senior citizens under this scheme?"
    ]
  },
  {
    id: "nos",
    name: "National Overseas Scholarship Scheme for SC",
    hindiName: "राष्ट्रीय विदेशी छात्रवृत्ति योजना",
    shortCode: "NOS",
    category: "Scholarships",
    officialUrl: "https://nosmsje.gov.in/",
    helpline: "011-23382285 / nosmsje-sjd@nic.in",
    objective: "To facilitate low-income meritorious students from Scheduled Castes, De-notified Tribes, Landless Agricultural Labourers, and Traditional Artisans to obtain higher education (Master's and Ph.D.) abroad.",
    eligibility: "Meritorious students from SC / De-notified, Nomadic tribes whose total family annual income does not exceed ₹8.00 Lakh, having scored a minimum of 60% marks in the qualifying degree, and aged below 35 years.",
    benefits: "Full coverage of overseas tuition fees, annual maintenance allowance (approx. USD 15,400 or GBP 9,900), travel passage costs, visa fees, contingency allowance, and medical insurance.",
    referenceQuestions: [
      "What are the eligibility criteria for the National Overseas Scholarship (NOS)?",
      "What expenses are covered under the National Overseas Scholarship for SC students?",
      "How can I apply online and what documents are needed for the NOS portal?"
    ]
  },
  {
    id: "smile-beggary",
    name: "SMILE - Beggary Portal (Support for Marginalised Individuals)",
    hindiName: "स्माइल - भीख मांगने वाले व्यक्तियों के लिए उप-योजना",
    shortCode: "SMILE-Beggary",
    category: "Transgender/Beggary",
    officialUrl: "https://smile.dosje.gov.in/",
    helpline: "011-20893961 (SMILE Helpdesk)",
    objective: "A comprehensive central sector scheme focused on rehabilitation, provision of medical facilities, counseling, basic education, skill development, and sustainable economic resettlement of persons engaged in begging.",
    eligibility: "Persons engaged in the act of begging, destitute, or homeless persons living in targeted municipal and urban corporations.",
    benefits: "Shelter homes, medical care diagnostics, skill training batches under PM-DAKSH, counseling, and seed capital assistance for self-employment or alternative livelihoods.",
    referenceQuestions: [
      "What is the SMILE scheme for persons engaged in the act of begging?",
      "What are the major municipal corporations participating in SMILE Beggary rehabilitation?",
      "Does the SMILE scheme provide skill training and entrepreneurship link-ups?"
    ]
  },
  {
    id: "transgender-portal",
    name: "National Portal for Transgender Persons",
    hindiName: "राष्ट्रीय उभयलिंगी (ट्रांसजेंडर) व्यक्ति पोर्टल",
    shortCode: "Transgender-ID",
    category: "Transgender/Beggary",
    officialUrl: "https://transgender.dosje.gov.in/",
    helpline: "011-20893961 / tgportal-msje@gov.in",
    objective: "An end-to-end digital portal where transgender persons across India can apply for a Transgender Certificate and Identity card without any physical interface, preventing harassment.",
    eligibility: "Any individual of transgender identity residing within India.",
    benefits: "Direct issuance of Certificate of Transgender Identity and ID Card from District Magistrates electronically. Grants access to Garima Greh (shelter homes with skill training) and scholarships.",
    referenceQuestions: [
      "How can a transgender person register and apply for a Certificate of Identity?",
      "What are the shelter support services (Garima Greh) funded by MoSJE?",
      "What are the scholarship benefits under the SMILE scheme for Transgender Students?"
    ]
  },
  {
    id: "post-matric-sc",
    name: "Post Matric Scholarship for SC Students",
    hindiName: "अनुसूचित जाति छात्रों के लिए पोस्ट मैट्रिक छात्रवृत्ति",
    shortCode: "Post-Matric-SC",
    category: "Scholarships",
    officialUrl: "https://scholarships.gov.in/",
    helpline: "1800-112-244 (NSP Helpline)",
    objective: "To provide financial assistance to Scheduled Caste students enabling them to complete post-matriculation or post-secondary courses spanning from 11th standard up to professional degrees.",
    eligibility: "Scheduled Caste (SC) students studying in recognized institutions within India, whose parental or family annual income is below ₹2.5 Lakh.",
    benefits: "100% funding of non-refundable compulsory fees charged by the colleges, and an annual Academic Allowance up to ₹13,500 directly transferred to students via Aadhaar-seeded DBT.",
    referenceQuestions: [
      "What is the Post Matric Scholarship for SC Students?",
      "What is the annual parental income limit and scholarship allowance rate for SC students?",
      "How is the Direct Benefit Transfer (DBT) structure implemented on the NSP portal?"
    ]
  },
  {
    id: "pm-daksh",
    name: "PM-DAKSH (Pradhan Mantri Dakshta Aur Kushalta Sampann Hitgrahi)",
    hindiName: "पीएम-दक्ष योजना (दक्षता और कुशलता संपन्न हितग्राही)",
    shortCode: "PM-DAKSH",
    category: "SC",
    officialUrl: "https://pmdaksh.dosje.gov.in/",
    helpline: "1800-11-0396 (Toll-Free PM-DAKSH Support)",
    objective: "National Action Plan for skilling marginalized youth to elevate their competency, increase productivity, and enable wage or self-employment through professional training institutes.",
    eligibility: "Scheduled Castes (SCs), Other Backward Classes (OBCs) with family annual income < ₹3 Lakh, Economically Backward Classes (EBCs) with annual income < ₹1 Lakh, Safai Karamcharis (including waste pickers). Age limit: 18-45 years.",
    benefits: "Free skill training across 4 classes: Upskilling/Reskilling (32-80 hrs), Short Term Training (300-400 hrs), Entrepreneurship Development (80-90 hrs), and Long Term Courses (up to 1 year). Provides stipend of ₹1,000 to ₹1,500/month plus training certification and job placements.",
    referenceQuestions: [
      "What are the four levels of skill training available under PM-DAKSH?",
      "What is the stipend criteria for Trainees enrolled in PM-DAKSH?",
      "Who is eligible to apply for PM-DAKSH and how to register on the app?"
    ]
  },
  {
    id: "poa-helpdesk",
    name: "National Helpdesk for Prevention of Atrocities (POA)",
    hindiName: "अत्याचार निवारण के लिए राष्ट्रीय हेल्पडेस्क (POA)",
    shortCode: "POA-Helpdesk",
    category: "Helpline",
    officialUrl: "http://socialjustice.gov.in/",
    helpline: "14566 (Toll-Free POA Helpline - 24/7)",
    objective: "To ensure effective implementation of the Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989. The helpdesk tracks and registers complaints, safeguards victims, and offers legal aid.",
    eligibility: "Any individual from Scheduled Castes (SC) or Scheduled Tribes (ST) experiencing atrocities, harassment, or social boycott.",
    benefits: "24/7 interactive legal/support assistance in 12 languages. Automatic logging of grievances, coordination with local police for FIR registration, tracking chargesheet speeds, and assisting in obtaining rehabilitation relief grants.",
    referenceQuestions: [
      "How can I register a grievance using the National Prevention of Atrocities Helpline 14566?",
      "How does the POA Helpdesk support victims of atrocities in registering FIRs and getting compensation?",
      "Is the National Helpdesk for Prevention of Atrocities available 24/7?"
    ]
  },
  {
    id: "dapsc",
    name: "Development Action Plan for Scheduled Castes",
    hindiName: "अनुसूचित जातियों के लिए विकास कार्य योजना (DAPSC)",
    shortCode: "DAPSC",
    category: "SC",
    officialUrl: "https://e-utthaan.gov.in/",
    helpline: "011-23382343 (MoSJE Monitoring Division)",
    objective: "To secure allocation of funds by various Ministries/Departments under the Union Government corresponding to the SC population, and strictly monitor financial and physical implementation of SC welfare schemes via e-Utthaan.",
    eligibility: "Administrative policy monitoring framework. Direct beneficiaries are general SC communities across rural and urban India.",
    benefits: "Ensures proportional allocation of national budget (~15% and above) to Scheduled Caste welfare. Public transparency of budget usage and infrastructure creation on the e-Utthaan online dashboard map.",
    referenceQuestions: [
      "What is the online e-Utthaan portal for DAPSC?",
      "How can the public monitor government budget utilization for Scheduled Caste welfare?",
      "Which central ministries fall under the monitoring guidelines of DAPSC?"
    ]
  },
  {
    id: "dams",
    name: "Drug Abuse Monitoring System",
    hindiName: "नशीली दवाओं के दुरुपयोग की निगरानी प्रणाली",
    shortCode: "DAMS",
    category: "De-addiction",
    officialUrl: "http://socialjustice.gov.in/",
    helpline: "011-20893961 (National Institute of Social Defence)",
    objective: "An integrated portal designed to monitor drug abuse metrics, rehabilitation center (IRCA) intakes, de-addiction treatments administered, patient rehabilitation progress, and map hotspots.",
    eligibility: "Registered Rehabilitation Centers, Integrated Rehabilitation Centers for Addicts (IRCAs), Community Peer-led Intervention (CPLI) schemes.",
    benefits: "Standardizes patient tracking, provides high-accuracy diagnostic analytics for ministries, prevents fraud in NGO rehabilitation centers, and feeds directly into national de-addiction policies.",
    referenceQuestions: [
      "What is the core function of the Drug Abuse Monitoring System (DAMS)?",
      "Do individual rehabilitation centers (IRCAs) upload real-time patient data to DAMS?",
      "How does DAMS help the government identify drug-addiction hotspots across India?"
    ]
  },
  {
    id: "namaste",
    name: "NAMASTE (Mechanised Sanitation Ecosystem)",
    hindiName: "नमस्ते योजना (यंत्रीकृत स्वच्छता पारिस्थितिकी तंत्र के लिए राष्ट्रीय कार्रवाई)",
    shortCode: "NAMASTE",
    category: "Sanitation",
    officialUrl: "https://namaste.dosje.gov.in/",
    helpline: "1800-11-1244 (NAMASTE Helpdesk)",
    objective: "To eradicate manual cleaning of sewers and septic tanks, ensure zero fatalities in sanitation work across India, and transition sanitation workers (SSWs) into formal, trained, and mechanized micro-entrepreneurs.",
    eligibility: "Sewer and septic tank cleaners, manual scavengers, and marginalized municipal sanitation workers.",
    benefits: "Alternative livelihood skill training with ₹3,000 monthly stipend, PPE kit distribution, identity card, capital subsidy up to ₹5 Lakh on purchasing suction machines or mechanized sewer cleaning equipment, and Ayushman Bharat health insurance.",
    referenceQuestions: [
      "What is the objective of the NAMASTE scheme for sanitation workers?",
      "What financial subsidies are given to sewer cleaners to purchase mechanized equipment under NAMASTE?",
      "How does the NAMASTE portal help eliminate sanitation hazards and manual scavenging?"
    ]
  },
  {
    id: "nhsc-elderline",
    name: "National Helpline for Senior Citizens (Elder Line)",
    hindiName: "राष्ट्रीय वृद्धजन हेल्पलाइन (एल्डर लाइन - 14567)",
    shortCode: "Elder-Line",
    category: "Helpline",
    officialUrl: "https://elderline.dosje.gov.in/",
    helpline: "14567 (Toll-Free national toll-free helpline)",
    objective: "A dedicated toll-free helpline 14567 to resolve queries of senior citizens, provide legal advice regarding maintenance, rescue homeless seniors, and deliver active emotional counseling.",
    eligibility: "All senior citizens in India or families, caregivers, and citizens wishing to report elderly abuse, neglect, or abandonment.",
    benefits: "Information on pension schemes, guidance on the Maintenance and Welfare of Parents and Senior Citizens Act, real-time rescue coordinates for abandoned/homeless elders, and mediation in family disputes.",
    referenceQuestions: [
      "How does the National Helpline for Senior Citizens - Elder Line (14567) operate?",
      "Can Elder Line help rescue an abandoned elderly person on the street?",
      "What kind of legal counseling is available for senior citizens through Elder Line?"
    ]
  },
  {
    id: "tapas",
    name: "TAPAS LMS NISD Portal (Training social defense)",
    hindiName: "तपस पोर्टल (उत्पादकता और सेवाओं को बढ़ाने के लिए प्रशिक्षण)",
    shortCode: "TAPAS",
    category: "NGO",
    officialUrl: "https://tapas.nisd.gov.in/",
    helpline: "011-20893966 / info.nisd@gov.in",
    objective: "To provide an online, open-access Learning Management System (LMS) carrying extensive courses in social defense topics like substance abuse prevention, elder care, transgender rehabilitation, and social welfare work.",
    eligibility: "Open to all - students, NGO representatives, social workers, healthcare workers, police, and citizens passionate about social service.",
    benefits: "Free self-paced webinars, premium courses curated by academic experts, downloadable research dossiers, and official completion certificate signed by National Institute of Social Defence (NISD).",
    referenceQuestions: [
      "What courses are offered on the TAPAS NISD portal?",
      "Is there a registration fee to take welfare training courses on TAPAS?",
      "Are certificates awarded after completing the Training for Augmenting Productivity (TAPAS)?"
    ]
  },
  {
    id: "pm-suraj",
    name: "PM-SURAJ National Credit Portal",
    hindiName: "पीएम-सूरज राष्ट्रीय क्रेडिट सहायता पोर्टल",
    shortCode: "PM-SURAJ",
    category: "Sanitation",
    officialUrl: "https://pmsuraj.dosje.gov.in/",
    helpline: "1800-11-0396 (PM SURAJ Helpline)",
    objective: "An online single-window credit portal providing subsidized business loans directly to the most marginalized sections (SCs, OBCs, Safai Karamcharis, Sanitation workers) to promote self-reliance and entrepreneurship.",
    eligibility: "Marginalized individuals with family income < ₹3 Lakh belonging to Scheduled Castes, Other Backward Classes (OBC), manual scavengers, sewage cleaners, and Safai Karamcharis.",
    benefits: "Direct loan sanction up to ₹15 Lakhs for business startup units, interest subvention/subsidy up to 4%, fast-track collateral-free lending through partner banks (SFCs, RRBs, Nationalized Banks) without complex paperwork, eliminating intermediaries.",
    referenceQuestions: [
      "What is the PM-SURAJ Credit Support Portal?",
      "How can a sanitation worker or OBC entrepreneur secure a loan of up to 15 Lakh via PM-SURAJ?",
      "What is the interest rate subsidy offered under the PM-SURAJ credit system?"
    ]
  }
];
