// NJS Royale Beach Resort — Phase One recruitment data.
//
// This file is the single source of truth for the Careers section. Every summary,
// responsibility and requirement is transcribed from an authoritative source:
//   - the 19 operational roles, from "Job Descriptions for Yahweh Heights and
//     Voyage Vacancies";
//   - the 3 Phase I Marketing Team roles, from the marketing team brief.
// Wording is preserved; the documents' decorative separators are not.
//
// Confirmed facts (no salary is displayed or invented):
//   22 job titles · 61 available positions · 4 departments.
//
// Nothing here is invented. Where a fact was not supplied it is absent rather than
// guessed — the marketing roles carry no employment type because none was stated,
// and their requirements repeat only the candidate profile that was given.

export const APPLY_EMAIL = 'careers@njsbeachresort.com'

/** Builds the Apply-by-email link with an encoded, position-specific subject. */
export const applyMailtoHref = (title: string): string =>
  `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(`Application – ${title}`)}`

export const EMPLOYMENT_TYPE = 'Full-time'
export const CAREERS_LOCATION =
  'Mosere-Kogo Village, via Eko Akete, Ibeju-Lekki, Lagos State, Nigeria'

export const APPLICATION_DEADLINE = 'October 15, 2026'
/** End of the application window, expressed in Lagos time (WAT, UTC+01:00). */
export const APPLICATION_DEADLINE_ISO = '2026-10-15T23:59:59+01:00'
export const PHASE_ONE_OPENING = 'December 12, 2026'

export const GENERAL_NOTE =
  'Successful candidates will be expected to demonstrate professionalism, excellent ' +
  'customer service, teamwork, discipline, integrity and a strong commitment to the ' +
  'standards of NJS Royale Beach Resort.'

export type DepartmentId =
  | 'restaurant-front-of-house'
  | 'kitchen'
  | 'hr-administration'
  | 'marketing'

export interface Department {
  id: DepartmentId
  name: string
  blurb: string
}

/** Departments in display order. Marketing leads: it is the current recruitment drive. */
export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'marketing',
    name: 'Marketing',
    blurb:
      'The NJS Royale Phase I Marketing Team will manage the NJS Royale brand across Phase I, Phase II and the resort\u2019s continued development. The team will support the December 12, 2026 launch while building strong, consistent campaigns for the resort\u2019s future phases.',
  },
  {
    id: 'restaurant-front-of-house',
    name: 'Restaurant and Front-of-House',
    blurb:
      'Service leadership, hosting, serving and bar roles that shape the guest experience across Yahweh Heights and Voyage Restaurant.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    blurb:
      'Culinary roles delivering elevated, consistent and authentic Nigerian cuisine, from section chefs to pastry.',
  },
  {
    id: 'hr-administration',
    name: 'HR and Administration',
    blurb:
      'People and administration support for recruitment, records and staff development across the operation.',
  },
] as const

export interface Job {
  slug: string
  title: string
  department: DepartmentId
  positions: number
  /**
   * Null where NJS has not stated one. The UI omits the label entirely rather
   * than assuming full-time, and the JobPosting schema omits the field.
   */
  employmentType: string | null
  location: string
  applicationDeadline: string
  summary: string
  responsibilities: readonly string[]
  requirements: readonly string[]
}

// Common fields shared by every vacancy, applied through a small builder so each
// record still carries the full typed shape.
type JobSeed = Omit<Job, 'employmentType' | 'location' | 'applicationDeadline'> & {
  /** Omit to inherit the default; pass null when no employment type was stated. */
  employmentType?: string | null
}

const job = (seed: JobSeed): Job => ({
  ...seed,
  employmentType: seed.employmentType === undefined ? EMPLOYMENT_TYPE : seed.employmentType,
  location: CAREERS_LOCATION,
  applicationDeadline: APPLICATION_DEADLINE,
})

export const CAREERS: readonly Job[] = [
  // ── Restaurant and Front-of-House ──────────────────────────────────────────
  job({
    slug: 'restaurant-manager',
    title: 'Restaurant Manager',
    department: 'restaurant-front-of-house',
    positions: 1,
    summary:
      'Responsible for the overall management of restaurant operations, service standards, guest satisfaction, team performance and revenue.',
    responsibilities: [
      'Manage daily restaurant operations and service delivery.',
      'Lead and supervise restaurant staff.',
      'Manage reservations, table utilization and guest experience.',
      'Handle guest complaints and service recovery.',
      'Monitor sales, POS controls, discounts and voids.',
      'Control inventory, wastage and operating costs.',
      'Ensure hygiene, grooming and service standards.',
      'Prepare daily operational reports.',
    ],
    requirements: [
      'Degree or HND in Hospitality, Business Administration or a related field.',
      'Minimum 7 years restaurant experience, with at least 3 years in a premium restaurant or hotel.',
      'Strong leadership, communication and financial / POS management skills.',
      'Good knowledge of Nigerian dining and hospitality standards.',
    ],
  }),
  job({
    slug: 'assistant-restaurant-manager',
    title: 'Assistant Restaurant Manager',
    department: 'restaurant-front-of-house',
    positions: 2,
    summary:
      'Supports the Restaurant Manager in ensuring smooth daily operations and excellent guest service.',
    responsibilities: [
      'Lead assigned shifts and supervise service teams.',
      'Conduct staff briefings and assign sections.',
      'Monitor guest satisfaction and resolve service issues.',
      'Supervise POS, cash handling and closing procedures.',
      'Monitor attendance, grooming and staff performance.',
      'Support stock control and daily handovers.',
    ],
    requirements: [
      'Minimum 5 years food and beverage experience.',
      'At least 2 years in a supervisory or assistant management role.',
      'Strong leadership, communication and guest-service skills.',
    ],
  }),
  job({
    slug: 'restaurant-captain-supervisor',
    title: 'Restaurant Captain / Supervisor',
    department: 'restaurant-front-of-house',
    positions: 3,
    summary:
      'Supervises assigned restaurant sections and ensures consistent, professional service.',
    responsibilities: [
      'Manage assigned sections and service staff.',
      'Ensure proper sequence and timing of service.',
      'Inspect tables and food presentation.',
      'Handle minor guest complaints.',
      'Train and guide junior team members.',
      'Support opening and closing procedures.',
    ],
    requirements: [
      'Three to five years experience in an upscale restaurant or hotel.',
      'Strong knowledge of restaurant service.',
      'Good leadership and communication skills.',
    ],
  }),
  job({
    slug: 'maitre-d-senior-host',
    title: 'Maître D’ / Senior Host',
    department: 'restaurant-front-of-house',
    positions: 1,
    summary:
      'Leads the front-of-house arrival experience and ensures a warm, organized and premium guest welcome.',
    responsibilities: [
      'Manage reservations, seating and waitlists.',
      'Coordinate VIP and special-occasion arrangements.',
      'Manage table allocation and guest preferences.',
      'Supervise hosts and hostesses.',
      'Coordinate closely with restaurant management.',
      'Ensure smooth guest arrivals and departures.',
    ],
    requirements: [
      'Experience in a luxury restaurant or hotel.',
      'Excellent communication and interpersonal skills.',
      'Professional appearance and strong organizational ability.',
    ],
  }),
  job({
    slug: 'hosts-hostesses',
    title: 'Hosts / Hostesses',
    department: 'restaurant-front-of-house',
    positions: 3,
    summary: 'Create a warm and professional first impression for every guest.',
    responsibilities: [
      'Welcome and escort guests.',
      'Manage reservations and seating.',
      'Monitor waiting guests and table status.',
      'Communicate guest preferences and special occasions.',
      'Support VIP arrangements.',
    ],
    requirements: [
      'Excellent communication and customer-service skills.',
      'Confident, organized and professional.',
      'Strong English communication.',
    ],
  }),
  job({
    slug: 'senior-server',
    title: 'Senior Server',
    department: 'restaurant-front-of-house',
    positions: 4,
    summary:
      'Provides exceptional table service while supporting and guiding other servers.',
    responsibilities: [
      'Lead assigned sections.',
      'Explain menu items and Nigerian culinary offerings.',
      'Manage VIP tables and guest requests.',
      'Support upselling and revenue generation.',
      'Ensure proper sequence of service.',
      'Train and guide junior servers.',
    ],
    requirements: [
      'Experience in premium restaurant or hotel service.',
      'Strong knowledge of food and beverage.',
      'Excellent communication and guest-service skills.',
    ],
  }),
  job({
    slug: 'server',
    title: 'Server',
    department: 'restaurant-front-of-house',
    positions: 12,
    summary:
      'Provides professional, attentive and efficient food and beverage service.',
    responsibilities: [
      'Prepare and maintain assigned tables.',
      'Welcome guests and explain menu items.',
      'Take accurate orders and use the POS correctly.',
      'Serve food and beverages professionally.',
      'Monitor guest needs throughout the meal.',
      'Process bills and ensure a smooth departure.',
    ],
    requirements: [
      'Restaurant or hotel service experience preferred.',
      'Good communication and customer-service skills.',
      'Professional appearance and positive attitude.',
    ],
  }),
  job({
    slug: 'food-runner',
    title: 'Food Runner',
    department: 'restaurant-front-of-house',
    positions: 4,
    summary:
      'Ensures food is delivered accurately and promptly from the kitchen to the correct table.',
    responsibilities: [
      'Collect food from the pass.',
      'Confirm table numbers and orders.',
      'Ensure food presentation and temperature are maintained.',
      'Communicate with chefs and servers.',
      'Prevent food from remaining unnecessarily at the pass.',
    ],
    requirements: [
      'Restaurant experience is an advantage.',
      'Fast, organized and attentive to detail.',
      'Good teamwork and communication skills.',
    ],
  }),
  job({
    slug: 'busser-service-assistant',
    title: 'Busser / Service Assistant',
    department: 'restaurant-front-of-house',
    positions: 4,
    summary:
      'Supports the service team by maintaining clean, organized and fully prepared dining areas.',
    responsibilities: [
      'Clear and reset tables.',
      'Replenish water, bread, cutlery and service items.',
      'Maintain service stations.',
      'Support servers and runners.',
      'Maintain cleanliness throughout service.',
    ],
    requirements: [
      'Hospitality experience is an advantage.',
      'Energetic, reliable and team-oriented.',
      'Good attention to cleanliness and detail.',
    ],
  }),
  job({
    slug: 'restaurant-bartender',
    title: 'Restaurant Bartender',
    department: 'restaurant-front-of-house',
    positions: 2,
    summary:
      'Provides professional beverage and cocktail service within the restaurant.',
    responsibilities: [
      'Prepare cocktails and beverages according to standards.',
      'Provide knowledgeable beverage service.',
      'Maintain bar cleanliness and organization.',
      'Monitor stock, wastage and portion control.',
      'Follow hygiene and responsible-service standards.',
    ],
    requirements: [
      'Previous bartending experience.',
      'Knowledge of cocktails, wines and beverages.',
      'Good communication and customer-service skills.',
    ],
  }),
  job({
    slug: 'barback',
    title: 'Barback',
    department: 'restaurant-front-of-house',
    positions: 2,
    summary:
      'Supports bartenders by ensuring the bar remains clean, stocked and service-ready.',
    responsibilities: [
      'Replenish ice, glassware and garnishes.',
      'Assist with beverage stock.',
      'Maintain bar cleanliness.',
      'Support bartenders during busy service.',
      'Assist with closing and restocking.',
    ],
    requirements: [
      'Hospitality or bar experience is an advantage.',
      'Fast, organized and reliable.',
      'Strong teamwork skills.',
    ],
  }),

  // ── Kitchen ────────────────────────────────────────────────────────────────
  job({
    slug: 'chef-de-cuisine',
    title: 'Chef de Cuisine',
    department: 'kitchen',
    positions: 1,
    summary:
      'Leads the kitchen and ensures high-quality, consistent and authentic culinary execution.',
    responsibilities: [
      'Develop and maintain menus and recipes.',
      'Ensure elevated Nigerian culinary execution.',
      'Manage food quality, presentation and consistency.',
      'Control food costs, wastage and kitchen inventory.',
      'Supervise and train kitchen staff.',
      'Maintain hygiene and food-safety standards.',
      'Monitor supplier and ingredient quality.',
      'Respond to guest feedback and improve menus.',
    ],
    requirements: [
      'Minimum 8 years professional culinary experience.',
      'At least 3 years leading a professional kitchen.',
      'Strong Nigerian cuisine knowledge.',
      'Luxury or fine-dining experience preferred.',
      'Must be able to demonstrate practical culinary skills.',
    ],
  }),
  job({
    slug: 'sous-chef',
    title: 'Sous Chef',
    department: 'kitchen',
    positions: 2,
    summary:
      'Supports the Chef de Cuisine in managing kitchen operations and service execution.',
    responsibilities: [
      'Lead kitchen operations during assigned shifts.',
      'Supervise kitchen sections and staff.',
      'Ensure mise-en-place and food quality.',
      'Monitor recipes, temperatures and presentation.',
      'Support stock control and kitchen discipline.',
      'Ensure proper closing and sanitation.',
    ],
    requirements: [
      'Strong professional kitchen experience.',
      'Previous supervisory experience.',
      'Good knowledge of food preparation and kitchen operations.',
    ],
  }),
  job({
    slug: 'chef-de-partie',
    title: 'Chef de Partie',
    department: 'kitchen',
    positions: 4,
    summary:
      'Takes responsibility for an assigned kitchen section and maintains consistent quality.',
    responsibilities: [
      'Manage daily mise-en-place.',
      'Prepare dishes according to recipes and standards.',
      'Maintain food quality and presentation.',
      'Monitor stock within the assigned section.',
      'Maintain cleanliness and food safety.',
    ],
    requirements: [
      'Professional kitchen experience.',
      'Strong technical cooking skills.',
      'Ability to work under pressure and maintain consistency.',
    ],
  }),
  job({
    slug: 'demi-chef',
    title: 'Demi Chef',
    department: 'kitchen',
    positions: 3,
    summary: 'Supports the Chef de Partie and assists with preparation and service.',
    responsibilities: [
      'Assist with mise-en-place and cooking.',
      'Prepare assigned menu items.',
      'Maintain section cleanliness.',
      'Support junior kitchen staff.',
      'Follow food-safety and quality standards.',
    ],
    requirements: [
      'Previous professional kitchen experience.',
      'Good cooking and preparation skills.',
      'Ability to work effectively within a team.',
    ],
  }),
  job({
    slug: 'commis-line-cook',
    title: 'Commis / Line Cook',
    department: 'kitchen',
    positions: 5,
    summary:
      'Supports kitchen operations through food preparation and cooking under section supervision.',
    responsibilities: [
      'Prepare ingredients and assigned dishes.',
      'Follow recipes and portion standards.',
      'Maintain cleanliness and organization.',
      'Assist senior chefs during service.',
      'Follow food-safety procedures.',
    ],
    requirements: [
      'Culinary training or relevant kitchen experience preferred.',
      'Willingness to learn.',
      'Good discipline, speed and teamwork.',
    ],
  }),
  job({
    slug: 'prep-cold-kitchen-assistant',
    title: 'Prep / Cold Kitchen Assistant',
    department: 'kitchen',
    positions: 2,
    summary:
      'Supports the kitchen with preparation of ingredients, cold dishes and other daytime production.',
    responsibilities: [
      'Prepare vegetables, marinades and ingredients.',
      'Assist with salads, cold dishes and other preparations.',
      'Maintain food quality and proper storage.',
      'Keep preparation areas clean and organized.',
      'Follow food-safety standards.',
    ],
    requirements: [
      'Kitchen experience preferred.',
      'Good organization and attention to detail.',
      'Ability to work efficiently in a busy kitchen.',
    ],
  }),
  job({
    slug: 'pastry-dessert-cook',
    title: 'Pastry / Dessert Cook',
    department: 'kitchen',
    positions: 1,
    summary:
      'Prepares high-quality desserts and supports the restaurant’s pastry and dessert offering.',
    responsibilities: [
      'Prepare desserts and pastry items.',
      'Support Nigerian-inspired dessert development.',
      'Maintain consistent presentation and quality.',
      'Manage pastry mise-en-place.',
      'Maintain hygiene and proper storage.',
    ],
    requirements: [
      'Previous pastry or dessert experience.',
      'Good knowledge of pastry techniques.',
      'Creative, organized and detail-oriented.',
    ],
  }),

  // ── HR and Administration ────────────────────────────────────────────────
  job({
    slug: 'hr-officer',
    title: 'HR Officer',
    department: 'hr-administration',
    positions: 1,
    summary:
      'Supports recruitment, employee relations, HR administration and staff development across the operation.',
    responsibilities: [
      'Manage recruitment and interview processes.',
      'Maintain confidential employee records.',
      'Support onboarding and staff orientation.',
      'Monitor attendance, leave and HR documentation.',
      'Support training and employee development.',
      'Assist with employee relations and disciplinary matters.',
      'Prepare HR reports and staffing updates.',
      'Maintain HR policies and procedures.',
    ],
    requirements: [
      'Degree or HND in Human Resources, Business Administration, Industrial Relations, Management or a related field.',
      'Minimum 3 years relevant HR experience.',
      'Hospitality experience is an advantage.',
      'Strong communication and organizational skills.',
      'Proficiency in Microsoft Office and HR record management.',
      'High level of confidentiality and professionalism.',
      'HR certification is an advantage.',
    ],
  }),

  // ── Marketing (Phase I Marketing Team) ─────────────────────────────────────
  // No employment type was stated for these roles, so none is shown. The
  // requirements repeat only the supplied candidate profile: no degree, salary,
  // benefit, reporting line or closing date beyond the general one is invented.
  job({
    slug: 'marketing-campaign-manager',
    title: 'Marketing & Campaign Manager',
    department: 'marketing',
    positions: 2,
    employmentType: null,
    summary:
      'Owns the NJS Royale campaign programme: brand and commercial strategy, the December 12, 2026 launch, and the budgets, agencies and partnerships behind them.',
    responsibilities: [
      'Develop the overall NJS Royale brand and commercial marketing strategy.',
      'Plan and execute the December 12, 2026 launch campaign.',
      'Manage how Yahweh Heights, Voyage, Royale Horizon and Royale Pulse sit beneath the NJS Royale master brand.',
      'Oversee the marketing budget.',
      'Manage agencies and external partners.',
      'Review and approve campaigns, photography, video, copy and influencer partnerships.',
      'Oversee public relations, digital marketing, social media and commercial partnerships.',
      'Coordinate with Food & Beverage, Events, Reservations and Operations.',
      'Produce weekly marketing performance reports.',
      'Build the February and July campaigns without weakening or distracting from the December launch.',
    ],
    requirements: [
      'Ideally 2\u20136+ years of relevant experience in luxury hospitality, lifestyle, entertainment, premium consumer brands or destination marketing.',
      'Demonstrable ownership of significant campaigns or launches.',
    ],
  }),
  job({
    slug: 'content-producer-videographer-video-editor',
    title: 'Content Producer, Videographer & Video Editor',
    department: 'marketing',
    positions: 1,
    employmentType: null,
    summary:
      'Produces and edits the photography and video that carry the NJS Royale brand, from resort and event coverage to the content published across its channels.',
    responsibilities: [
      'Produce photography and video across the resort, its venues and its events.',
      'Edit video and stills to a consistent, premium standard.',
      'Cover the December 12, 2026 launch and the resort events that follow.',
      'Create content for social media and publish it across the resort\u2019s channels.',
      'Manage the content calendar.',
      'Maintain brand consistency across Yahweh Heights, Voyage, Royale Horizon and Royale Pulse beneath the NJS Royale master brand.',
      'Work with agencies and external partners on commissioned production.',
      'Coordinate with Food & Beverage, Events, Reservations and Operations on content requirements.',
    ],
    requirements: [
      'Ideally 2\u20136+ years of relevant experience in luxury hospitality, lifestyle, entertainment, premium consumer brands or destination marketing.',
      'A strong portfolio, with relevant production and editing experience.',
    ],
  }),
  job({
    slug: 'crm-reservations-marketing-manager',
    title: 'CRM & Reservations Marketing Manager',
    department: 'marketing',
    positions: 1,
    employmentType: null,
    summary:
      'Runs the CRM programme and the marketing that turns enquiries into confirmed reservations, working closely with Reservations and Operations.',
    responsibilities: [
      'Plan and deliver CRM campaigns across the guest lifecycle.',
      'Segment and maintain the guest database.',
      'Develop guest communications that reflect the NJS Royale brand.',
      'Convert enquiries into confirmed reservations.',
      'Run email, SMS and WhatsApp campaigns where appropriate.',
      'Support the December 12, 2026 launch campaign through direct guest communication.',
      'Produce weekly CRM and reservations marketing performance reports.',
      'Coordinate with Reservations, Operations, Food & Beverage and Events.',
    ],
    requirements: [
      'Ideally 2\u20136+ years of relevant experience in luxury hospitality, lifestyle, entertainment, premium consumer brands or destination marketing.',
      'Practical CRM, database marketing, guest communication or reservations-funnel experience.',
    ],
  }),
] as const

// ── Derived data ─────────────────────────────────────────────────────────────

export const TOTAL_TITLES = CAREERS.length
export const TOTAL_POSITIONS = CAREERS.reduce((sum, j) => sum + j.positions, 0)
export const TOTAL_DEPARTMENTS = DEPARTMENTS.length

export const getJob = (slug: string): Job | undefined =>
  CAREERS.find((j) => j.slug === slug)

export const getDepartment = (id: DepartmentId): Department =>
  DEPARTMENTS.find((d) => d.id === id) as Department

export const jobsByDepartment = (id: DepartmentId): Job[] =>
  CAREERS.filter((j) => j.department === id)

export const departmentPositions = (id: DepartmentId): number =>
  jobsByDepartment(id).reduce((sum, j) => sum + j.positions, 0)

// Programmatic confirmation of the confirmed recruitment totals. These run when the
// module is first imported (at build time), so a miscount fails the build loudly
// rather than shipping wrong figures.
if (TOTAL_TITLES !== 22) {
  throw new Error(`Careers data integrity error: expected 22 job titles, found ${TOTAL_TITLES}.`)
}
if (TOTAL_POSITIONS !== 61) {
  throw new Error(`Careers data integrity error: expected 61 positions, found ${TOTAL_POSITIONS}.`)
}
if (new Set(CAREERS.map((j) => j.slug)).size !== CAREERS.length) {
  throw new Error('Careers data integrity error: duplicate slug detected.')
}
