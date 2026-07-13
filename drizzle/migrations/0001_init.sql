-- Consolidated schema, squashed from the original step-by-step migrations.

CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATETIME,
  "refreshTokenExpiresAt" DATETIME,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AdmissionsContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "kurser" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "AssociationContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "buildings" TEXT NOT NULL DEFAULT '',
  "boardIntro" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  "sections" TEXT NOT NULL DEFAULT '[]',
  "mapHeading" TEXT NOT NULL DEFAULT 'Skolans byggnader',
  "boardHeading" TEXT NOT NULL DEFAULT 'Styrelsen',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "BgGradientSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "color1" TEXT NOT NULL DEFAULT '#FDFCF8',
  "color2" TEXT NOT NULL DEFAULT '#F7F4ED',
  "favorite1" TEXT,
  "favorite2" TEXT,
  "favorite3" TEXT,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "BoardingContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "boContent" TEXT NOT NULL DEFAULT '',
  "byggnaderna" TEXT NOT NULL DEFAULT '',
  "brandskydd" TEXT NOT NULL DEFAULT '',
  "priser" TEXT NOT NULL DEFAULT '',
  "prisHuvudtext" TEXT NOT NULL DEFAULT '',
  "kost" TEXT NOT NULL DEFAULT '',
  "faq" TEXT NOT NULL DEFAULT '',
  "kontaktKokNamn" TEXT NOT NULL DEFAULT '',
  "kontaktKokEmail" TEXT NOT NULL DEFAULT '',
  "kontaktKokTelefon" TEXT NOT NULL DEFAULT '',
  "kontaktBoNamn" TEXT NOT NULL DEFAULT '',
  "kontaktBoEmail" TEXT NOT NULL DEFAULT '',
  "kontaktBoTelefon" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  brandskyddSections TEXT NOT NULL DEFAULT '[]',
  prisInfoSections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "CareersContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  "sidebarProfileIds" TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "ContactContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "addressStreet" TEXT NOT NULL,
  "addressCity" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "invoiceEmail" TEXT NOT NULL,
  "bankgiro" TEXT NOT NULL,
  "absenceNotice" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  "officeHours" TEXT NOT NULL DEFAULT '',
  "invoiceNote" TEXT NOT NULL DEFAULT '',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "Course" (
  id TEXT PRIMARY KEY,
  courseType TEXT NOT NULL,
  deliveryMode TEXT,
  "parentKursId" TEXT REFERENCES "Course"(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  imageKey TEXT,
  isPublished INTEGER NOT NULL DEFAULT 0,
  duration TEXT,
  studyPace INTEGER,
  studyAidLevel TEXT,
  hasAccommodation INTEGER NOT NULL DEFAULT 0,
  accessibilityTags TEXT NOT NULL DEFAULT '[]',
  tracks TEXT NOT NULL DEFAULT '[]',
  infoSections TEXT NOT NULL DEFAULT '[]',
  staff TEXT NOT NULL DEFAULT '[]',
  links TEXT NOT NULL DEFAULT '[]',
  gallery TEXT NOT NULL DEFAULT '[]',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  headingColor TEXT,
  locationText TEXT,
  isArchived INTEGER NOT NULL DEFAULT 0,
  applicationSectionHeading TEXT NOT NULL DEFAULT ''
);

CREATE TABLE "CourseApplication" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "instanceId" TEXT NOT NULL REFERENCES "CourseInstance"("id") ON DELETE CASCADE,
  "registrationCode" TEXT NOT NULL,
  "courseTitle" TEXT NOT NULL,
  "schoolsoftId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "personalNumber" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT,
  "postalCode" TEXT,
  "city" TEXT,
  "priorEducation" TEXT,
  "motivation" TEXT,
  "extraAnswers" TEXT NOT NULL DEFAULT '{}',
  "attachments" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE "CourseDepartment" (
  "courseId" TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  "departmentId" TEXT NOT NULL REFERENCES Department(id) ON DELETE CASCADE,
  PRIMARY KEY ("courseId", "departmentId")
);

CREATE TABLE "CourseInstance" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL UNIQUE,
  "year" INTEGER NOT NULL,
  "periodType" TEXT NOT NULL,
  "week" INTEGER,
  "schoolsoftId" TEXT,
  "extraFields" TEXT NOT NULL DEFAULT '[]',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "startDate" INTEGER,
  "endDate" INTEGER,
  "spots" INTEGER,
  "applicationText" TEXT,
  "applicationMethods" TEXT NOT NULL DEFAULT '{"mode":"any","methods":[]}',
  "applicationBlocks" TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE "DayMenu" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "weeklyMenuId" TEXT NOT NULL REFERENCES "WeeklyMenu"("id") ON DELETE CASCADE,
  "day" INTEGER NOT NULL,
  "closed" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "DayMenuItem" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "dayMenuId" TEXT NOT NULL REFERENCES "DayMenu"("id") ON DELETE CASCADE,
  "dishId" TEXT REFERENCES "Dish"("id"),
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Department" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isCourseDepartment" INTEGER NOT NULL DEFAULT 0,
  href TEXT,
  imageKey TEXT
);

CREATE TABLE "Dish" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "allergens" TEXT,
  "imageKey" TEXT,
  "vegetarian" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "price" INTEGER,
  "studentPrice" INTEGER,
  "vegan" INTEGER NOT NULL DEFAULT 0,
  "blocks" TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE "ErrorReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "category" TEXT NOT NULL DEFAULT 'övrigt',
  "status" TEXT NOT NULL DEFAULT 'open',
  "imageKey" TEXT,
  "reportedBy" TEXT,
  "resolvedAt" INTEGER,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'mellan',
  "senderName" TEXT NOT NULL DEFAULT '',
  "senderEmail" TEXT NOT NULL DEFAULT '',
  "senderPhone" TEXT NOT NULL DEFAULT '',
  "building" TEXT NOT NULL DEFAULT '',
  "room" TEXT NOT NULL DEFAULT '',
  "allowEntry" INTEGER NOT NULL DEFAULT 0,
  "assignedTo" TEXT NOT NULL DEFAULT 'fastighet',
  CONSTRAINT "ErrorReport_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ErrorReportComment" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "reportId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE "EveningCoursesContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "heading" TEXT NOT NULL DEFAULT '',
  "headingVisible" INTEGER NOT NULL DEFAULT true,
  "headingColor" text,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "FolkEducationContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  "updatedAt" INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "HistoryContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT,
  timeline TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE "HomeContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "heroIngress" TEXT NOT NULL DEFAULT '',
  "whyUsText" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  "whyUsHeading" TEXT NOT NULL DEFAULT 'Why Us?',
  "whyUsHeadingVisible" INTEGER NOT NULL DEFAULT 1,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 0,
  headingColor TEXT
);

CREATE TABLE "MaintenanceReportContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT 'Anmäl fel och brister i lokaler eller utrustning. Vi tar hand om ärendet så snart möjligt.',
  "updatedAt" INTEGER NOT NULL,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "NatureLifeCoursesContent" (
  id TEXT PRIMARY KEY,
  "departmentId" TEXT REFERENCES Department(id) ON DELETE SET NULL,
  blocks TEXT NOT NULL DEFAULT '[]',
  updatedAt INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT,
  imageKey TEXT
);

CREATE TABLE "NavHubContent" (
  id TEXT PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT '',
  ingress TEXT NOT NULL DEFAULT '',
  links TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "News" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageKey" TEXT,
  "author" TEXT,
  "links" TEXT NOT NULL DEFAULT '[]',
  "isPublished" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" INTEGER,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  headingColor TEXT
);

CREATE TABLE "NewsHubContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "heading" TEXT NOT NULL DEFAULT '',
  "headingVisible" INTEGER NOT NULL DEFAULT true,
  "headingColor" text,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "ParticipantStoriesContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "blocks" TEXT NOT NULL DEFAULT '[]',
  "updatedAt" INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "ParticipantStory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "graduationYear" INTEGER,
  "courseName" TEXT,
  "story" TEXT NOT NULL,
  "imageKey" TEXT,
  "programId" TEXT,
  "summerCourseId" TEXT,
  "published" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "Profile" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "directPhone" TEXT,
  "email" TEXT,
  "bio" TEXT,
  "imageKey" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "ProfileDepartment" (
  "profileId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL DEFAULT '[]',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("profileId", "departmentId")
);

CREATE TABLE "RestaurantContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL,
  "pricesNote" TEXT NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "defaultMenuFooter" TEXT NOT NULL DEFAULT '',
  "blocks" TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" DATETIME NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StudentRightsContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "StudentSupportContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  "sidebarProfileIds" TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "StudyGuidanceContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  "sidebarProfileIds" TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "SummerCoursesAdmissionsContent" (
  id TEXT PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT,
  blocks TEXT NOT NULL DEFAULT '[]',
  updatedAt INTEGER NOT NULL
);

CREATE TABLE "SummerCoursesContent" (
  id TEXT PRIMARY KEY,
  blocks TEXT NOT NULL DEFAULT '[]',
  updatedAt INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "SummerCoursesPracticalInfoContent" (
  id TEXT PRIMARY KEY,
  blocks TEXT NOT NULL DEFAULT '[]',
  updatedAt INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "TermDatesContent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "updatedAt" INTEGER NOT NULL,
  sections TEXT NOT NULL DEFAULT '[]',
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "TypographySettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "h1Font" TEXT NOT NULL DEFAULT 'Geist',
  "h2Font" TEXT NOT NULL DEFAULT 'Geist',
  "h3Font" TEXT NOT NULL DEFAULT 'Geist',
  "bodyFont" TEXT NOT NULL DEFAULT 'Geist',
  "locked" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" INTEGER NOT NULL,
  "preset2" TEXT,
  "preset3" TEXT
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL,
  "image" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'student',
  "status" TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE "Venue" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "capacity" INTEGER,
  "availableTo" TEXT NOT NULL DEFAULT 'organizations',
  "features" TEXT NOT NULL DEFAULT '[]',
  "imageKey" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  category TEXT,
  priceInfo TEXT,
  blocks TEXT NOT NULL DEFAULT '[]',
  headingColor TEXT
);

CREATE TABLE "VenueInquiry" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "requestedDate" TEXT NOT NULL,
  "numberOfPeople" INTEGER NOT NULL,
  "venues" TEXT NOT NULL DEFAULT '[]',
  "meals" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" INTEGER NOT NULL,
  eventType TEXT NOT NULL DEFAULT '',
  alternativeDate TEXT,
  equipmentNeeded TEXT
);

CREATE TABLE "VenueInquiryComment" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "inquiryId" TEXT NOT NULL REFERENCES "VenueInquiry"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE "VenuesContent" (
  id TEXT PRIMARY KEY,
  blocks TEXT NOT NULL DEFAULT '[]',
  heading TEXT NOT NULL DEFAULT '',
  headingVisible INTEGER NOT NULL DEFAULT 1,
  headingColor TEXT
);

CREATE TABLE "Verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME,
  "updatedAt" DATETIME
);

CREATE TABLE "WeeklyMenu" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "week" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "notes" TEXT,
  "published" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "footer" TEXT,
  "blocks" TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX "CourseApplication_instanceId_idx" ON "CourseApplication" ("instanceId");

CREATE INDEX "CourseInstance_kursId_idx" ON "CourseInstance" ("courseId");

CREATE INDEX "CourseInstance_period_idx" ON "CourseInstance" ("year", "periodType");

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "WeeklyMenu_year_week_key" ON "WeeklyMenu"("year", "week");

CREATE INDEX kurs_type_published_idx ON "Course" (courseType, isPublished);