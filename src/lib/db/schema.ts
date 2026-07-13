import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

// Auth tables — column names match the DB exactly (created by Prisma migration 0001_init.sql).
// Better Auth requires these exact field names.

export const user = sqliteTable("User", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  role:   text("role").notNull().default("staff"),
  status: text("status").notNull().default("pending"),
});

export const session = sqliteTable("Session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("Account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("Verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }),
});

// Application tables
// Date/time columns use INTEGER Unix milliseconds via Drizzle timestamp_ms.
// Keep Better Auth tables aligned with the adapter; format dates for humans in UI/API responses.

export const news = sqliteTable("News", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  imageKey: text("imageKey"),
  author: text("author"),
  links: text("links").notNull().default("[]"),
  headingColor: text("headingColor"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const participantStory = sqliteTable("ParticipantStory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  graduationYear: integer("graduationYear"),
  courseName: text("courseName"),
  story: text("story").notNull(),
  imageKey: text("imageKey"),
  programId: text("programId"),
  summerCourseId: text("summerCourseId"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

// Unified course table. See COURSES.md for full field documentation and enum values.
export const course = sqliteTable("Course", {
  id: text("id").primaryKey(),

  // courseType: 'program' | 'program_track' | 'short' | 'summer' | 'evening'
  courseType: text("courseType").notNull(),
  // deliveryMode: 'campus' | 'distance_hybrid' | 'distance_pure' | 'outdoor'
  deliveryMode: text("deliveryMode"),
  // FK to Course.id — optional link from short course to parent course
  parentKursId: text("parentKursId").references(
    (): AnySQLiteColumn => course.id,
    { onDelete: "set null" },
  ),
  // ── Common ──────────────────────────────────────────────────────
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  description: text("description").notNull().default(""),
  imageKey: text("imageKey"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  isArchived: integer("isArchived", { mode: "boolean" }).notNull().default(false),

  // ── Duration & pace ─────────────────────────────────────────────
  duration: text("duration"),           // display text: "2 terminer"
  studyPace: integer("studyPace"),      // percentage: 25 | 50 | 75 | 100

  // ── Study aid (replaces csnEligible boolean) ─────────────────────
  // 'compulsory' | 'upper_secondary' | 'post_secondary' | 'none'
  studyAidLevel: text("studyAidLevel"),

  // ── Accommodation & accessibility ────────────────────────────────
  hasAccommodation: integer("hasAccommodation", { mode: "boolean" }).notNull().default(false),
  accessibilityTags: text("accessibilityTags").notNull().default("[]"), // JSON array

  // ── Program-specific (null for summer/evening) ───────────────────
  locationText: text("locationText"),          // "Demo Folk High School in Lindeby"
  tracks: text("tracks").notNull().default("[]"),
  infoSections: text("infoSections").notNull().default("[]"),
  staff: text("staff").notNull().default("[]"),
  links: text("links").notNull().default("[]"),
  gallery: text("gallery").notNull().default("[]"),
  blocks: text("blocks").notNull().default("[]"),
  headingColor: text("headingColor"),
  applicationSectionHeading: text("applicationSectionHeading").notNull().default(""),

  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
}, (t) => [
  index("kurs_type_published_idx").on(t.courseType, t.isPublished),
]);

export const dish = sqliteTable("Dish", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  allergens: text("allergens"),
  imageKey: text("imageKey"),
  price: integer("price"),
  studentPrice: integer("studentPrice"),
  vegetarian: integer("vegetarian", { mode: "boolean" }).notNull().default(false),
  vegan: integer("vegan", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const weeklyMenu = sqliteTable("WeeklyMenu", {
  id: text("id").primaryKey(),
  week: integer("week").notNull(),
  year: integer("year").notNull(),
  notes: text("notes"),
  footer: text("footer"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const dayMenu = sqliteTable("DayMenu", {
  id: text("id").primaryKey(),
  weeklyMenuId: text("weeklyMenuId")
    .notNull()
    .references(() => weeklyMenu.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
});

export const dayMenuItem = sqliteTable("DayMenuItem", {
  id: text("id").primaryKey(),
  dayMenuId: text("dayMenuId")
    .notNull()
    .references(() => dayMenu.id, { onDelete: "cascade" }),
  dishId: text("dishId").references(() => dish.id),
  sortOrder: integer("sortOrder").notNull().default(0),
});

export const restaurantContent = sqliteTable("RestaurantContent", {
  id: text("id").primaryKey(),
  intro: text("intro").notNull(),
  pricesNote: text("pricesNote").notNull(),
  defaultMenuFooter: text("defaultMenuFooter").notNull().default(""),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const venue = sqliteTable("Venue", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category"),       // Conference Room | Event Venue | Sports Hall | Classroom | Dining Hall | Other
  capacity: integer("capacity"),
  priceInfo: text("priceInfo"),      // free text, e.g. "2,500 SEK / half day"
  availableTo: text("availableTo").notNull().default("organizations"),
  features: text("features").notNull().default("[]"),
  imageKey: text("imageKey"),
  blocks: text("blocks").notNull().default("[]"),
  headingColor: text("headingColor"),
  sortOrder: integer("sortOrder").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const venueInquiry = sqliteTable("VenueInquiry", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  eventType: text("eventType").notNull().default(""),   // meeting | conference | event | course | other
  requestedDate: text("requestedDate").notNull(),
  alternativeDate: text("alternativeDate"),
  numberOfPeople: integer("numberOfPeople").notNull(),
  venues: text("venues").notNull().default("[]"),
  equipmentNeeded: text("equipmentNeeded"),
  meals: text("meals"),
  notes: text("notes"),
  status: text("status").notNull().default("new"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

export const venueInquiryComment = sqliteTable("VenueInquiryComment", {
  id: text("id").primaryKey(),
  inquiryId: text("inquiryId").notNull().references(() => venueInquiry.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

export const errorReport = sqliteTable("ErrorReport", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  building: text("building").notNull().default(""),
  room: text("room").notNull().default(""),
  allowEntry: integer("allowEntry", { mode: "boolean" }).notNull().default(false),
  category: text("category").notNull().default("other"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  // Recipient mailbox that owns the case: "incident" (IT) or "facilities" (janitorial).
  assignedTo: text("assignedTo").notNull().default("facilities"),
  senderName: text("senderName").notNull().default(""),
  senderEmail: text("senderEmail").notNull().default(""),
  senderPhone: text("senderPhone").notNull().default(""),
  imageKey: text("imageKey"),
  reportedBy: text("reportedBy").references(() => user.id),
  resolvedAt: integer("resolvedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const errorReportComment = sqliteTable("ErrorReportComment", {
  id: text("id").primaryKey(),
  reportId: text("reportId").notNull().references(() => errorReport.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

// A unique course instance (one course, one particular intake/period). The registration
// code ("AK 26 VT") is generated from year/periodType/week — see src/lib/course-instance.ts.
export const courseInstance = sqliteTable("CourseInstance", {
  id: text("id").primaryKey(),
  courseId: text("courseId").notNull().references(() => course.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),                 // URL-safe, for /apply/[code]
  // Structured, searchable period fields — the registration code is GENERATED from these.
  year: integer("year").notNull(),                       // intake year, e.g. 2026
  periodType: text("periodType").notNull(),              // 'spring' | 'fall' | 'full_year' | 'summer'
  week: integer("week"),                                 // optional, for summer weeks (e.g. 29)
  schoolsoftId: text("schoolsoftId"),                    // for manual SchoolSoft registration
  // optional course-specific extra questions: [{ id, label, type, options?, required }]
  extraFields: text("extraFields").notNull().default("[]"),
  sortOrder: integer("sortOrder").notNull().default(0),

  // ── Per-instance dates and locations ─────────────────────────────
  startDate: integer("startDate", { mode: "timestamp_ms" }),
  endDate: integer("endDate", { mode: "timestamp_ms" }),
  spots: integer("spots"),
  // ── Application methods: { open, mode, methods[] } ──────────────
  applicationMethods: text("applicationMethods").notNull().default('{"mode":"any","methods":[]}'),
  applicationText: text("applicationText"),
  // ── Editorial content about the application process (ContentBlock[]) ─
  applicationBlocks: text("applicationBlocks").notNull().default("[]"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const courseApplication = sqliteTable("CourseApplication", {
  id: text("id").primaryKey(),
  instanceId: text("instanceId").notNull().references(() => courseInstance.id, { onDelete: "cascade" }),
  // snapshot at submission time (the instance may change/be deleted later)
  registrationCode: text("registrationCode").notNull(),
  courseTitle: text("courseTitle").notNull(),
  schoolsoftId: text("schoolsoftId"),               // snapshot for manual SchoolSoft registration
  // fixed personal details
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  personalNumber: text("personalNumber").notNull(),  // YYYYMMDD-XXXX
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  postalCode: text("postalCode"),
  city: text("city"),
  priorEducation: text("priorEducation"),            // prior education/background
  motivation: text("motivation"),                    // motivation
  // answers to the instance's extraFields: { [fieldId]: value }
  extraAnswers: text("extraAnswers").notNull().default("{}"),
  // attached files (document/photo/video): [{ key, name, type, size }]
  attachments: text("attachments").notNull().default("[]"),
  status: text("status").notNull().default("new"),   // new | reviewing | accepted | declined
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

export const profile = sqliteTable("Profile", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone"),
  directPhone: text("directPhone"),
  email: text("email"),
  bio: text("bio"),
  imageKey: text("imageKey"),
  sortOrder: integer("sortOrder").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const department = sqliteTable("Department", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sortOrder").notNull().default(0),
  isCourseDepartment: integer("isCourseDepartment", { mode: "boolean" }).notNull().default(false),
  href: text("href"),
  imageKey: text("imageKey"),
});

export const contactContent = sqliteTable("ContactContent", {
  id: text("id").primaryKey(),
  addressStreet: text("addressStreet").notNull(),
  addressCity: text("addressCity").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  invoiceEmail: text("invoiceEmail").notNull(),
  invoiceNote: text("invoiceNote").notNull().default(""),
  bankgiro: text("bankgiro").notNull(),
  officeHours: text("officeHours").notNull().default(""),
  absenceNotice: text("absenceNotice").notNull().default(""),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const historyContent = sqliteTable("HistoryContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  timeline: text("timeline").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const careersContent = sqliteTable("CareersContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  sidebarProfileIds: text("sidebarProfileIds").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const studentRightsContent = sqliteTable("StudentRightsContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const studentSupportContent = sqliteTable("StudentSupportContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  sidebarProfileIds: text("sidebarProfileIds").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const studyGuidanceContent = sqliteTable("StudyGuidanceContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  sidebarProfileIds: text("sidebarProfileIds").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const termDatesContent = sqliteTable("TermDatesContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const admissionsContent = sqliteTable("AdmissionsContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const summerCoursesAdmissionsContent = sqliteTable("SummerCoursesAdmissionsContent", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const boardingContent = sqliteTable("BoardingContent", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const folkEducationContent = sqliteTable("FolkEducationContent", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const associationContent = sqliteTable("AssociationContent", {
  id: text("id").primaryKey(),
  sections: text("sections").notNull().default("[]"),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  mapHeading: text("mapHeading").notNull().default("The school's buildings"),
  buildings: text("buildings").notNull().default(""),
  boardHeading: text("boardHeading").notNull().default("The board"),
  boardIntro: text("boardIntro").notNull().default(""),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const homeContent = sqliteTable("HomeContent", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible").notNull().default(0),
  headingColor: text("headingColor"),
  heroIngress: text("heroIngress").notNull().default(""),
  whyUsText: text("whyUsText").notNull().default(""),
  whyUsHeading: text("whyUsHeading").notNull().default("Why Us?"),
  whyUsHeadingVisible: integer("whyUsHeadingVisible").notNull().default(1),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const summerCoursesContent = sqliteTable("SummerCoursesContent", {
  id:             text("id").primaryKey(),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const summerCoursesPracticalInfoContent = sqliteTable("SummerCoursesPracticalInfoContent", {
  id:             text("id").primaryKey(),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const natureLifeCoursesContent = sqliteTable("NatureLifeCoursesContent", {
  id:             text("id").primaryKey(),
  departmentId:   text("departmentId").references(() => department.id, { onDelete: "set null" }),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  imageKey:       text("imageKey"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const eveningCoursesContent = sqliteTable("EveningCoursesContent", {
  id:             text("id").primaryKey(),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const newsHubContent = sqliteTable("NewsHubContent", {
  id:             text("id").primaryKey(),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const participantStoriesContent = sqliteTable("ParticipantStoriesContent", {
  id:             text("id").primaryKey(),
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const maintenanceReportContent = sqliteTable("MaintenanceReportContent", {
  id: text("id").primaryKey(),
  intro: text("intro").notNull().default("Report faults and issues with facilities or equipment. We'll take care of it as soon as possible."),
  heading: text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor: text("headingColor"),
  blocks: text("blocks").notNull().default("[]"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const courseDepartment = sqliteTable("CourseDepartment", {
  courseId:     text("courseId").notNull().references(() => course.id, { onDelete: "cascade" }),
  departmentId: text("departmentId").notNull().references(() => department.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.courseId, t.departmentId] }),
]);

export const profileDepartment = sqliteTable("ProfileDepartment", {
  profileId: text("profileId").notNull().references(() => profile.id, { onDelete: "cascade" }),
  departmentId: text("departmentId").notNull().references(() => department.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("[]"),
  sortOrder: integer("sortOrder").notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.profileId, t.departmentId] }),
]);

export const navHubContent = sqliteTable("NavHubContent", {
  id:             text("id").primaryKey(), // "deltagarinfo" | "om-skolan" | "skolan" | "utbildningar" | "kortkurser"
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  ingress:        text("ingress").notNull().default(""),
  links:          text("links").notNull().default("[]"), // JSON: {name, href}[] — legacy circles
  blocks:         text("blocks").notNull().default("[]"), // JSON: Block[]
});

export const venuesContent = sqliteTable("VenuesContent", {
  id:             text("id").primaryKey(), // "main"
  heading:        text("heading").notNull().default(""),
  headingVisible: integer("headingVisible", { mode: "boolean" }).notNull().default(true),
  headingColor:   text("headingColor"),
  blocks:         text("blocks").notNull().default("[]"),
});

export const bgGradientSettings = sqliteTable("BgGradientSettings", {
  id:        text("id").primaryKey(),
  color1:    text("color1").notNull().default("#FDFCF8"),
  color2:    text("color2").notNull().default("#F7F4ED"),
  favorite1: text("favorite1"),
  favorite2: text("favorite2"),
  favorite3: text("favorite3"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const typographySettings = sqliteTable("TypographySettings", {
  id:        text("id").primaryKey(),
  h1Font:    text("h1Font").notNull().default("Geist"),
  h2Font:    text("h2Font").notNull().default("Geist"),
  h3Font:    text("h3Font").notNull().default("Geist"),
  bodyFont:  text("bodyFont").notNull().default("Geist"),
  locked:    integer("locked", { mode: "boolean" }).notNull().default(false),
  preset2:   text("preset2"),
  preset3:   text("preset3"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});
