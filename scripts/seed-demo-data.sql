-- ============================================================================
-- seed-demo-data.sql
--
-- Fills the empty demo database (school-cms-demo-db) with 100% fictional content
-- so that Studio and all public pages have something realistic to display.
-- This is a portfolio clone of a folk high school website — NO real
-- names, phone numbers, email addresses, or personal identification numbers
-- appear here.
--
-- Run with:
--   wrangler d1 execute school-cms-demo-db --local --file scripts/seed-demo-data.sql
--   wrangler d1 execute school-cms-demo-db --remote --file scripts/seed-demo-data.sql
--
-- ── ImageKeys used (for R2 upload of placeholder images) ─────────
--   profiles/demo-01.jpg .. profiles/demo-15.jpg               (15, Profile)
--   kurser/demo-01.jpg .. kurser/demo-10.jpg                   (10, Course)
--   participant-portraits/demo-01.jpg .. demo-05.jpg           (5, ParticipantStory)
--   venues/demo-01.jpg .. demo-04.jpg                          (4, Venue)
--
-- All ImageKeys above are placeholders — upload the corresponding jpg files
-- to R2 under exactly these keys. The remaining imageKey columns
-- (Department, Dish, News, NatureLifeCoursesContent) are left NULL in this
-- seed script.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 0. Clean out the real department names seeded directly by migrations
--    0013/0014 — real program names from the original site, not fictional
--    ones. The table has no FK references in a fresh database, so this
--    delete is safe.
-- ────────────────────────────────────────────────────────────────────────────
DELETE FROM Department WHERE id NOT LIKE 'demo-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Department — fictional departments/subject areas
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO Department (id, name, sortOrder, isCourseDepartment, href, imageKey) VALUES
  ('demo-dept-01', 'Art',                          1,  1, NULL, NULL),
  ('demo-dept-02', 'Music',                        2,  1, NULL, NULL),
  ('demo-dept-03', 'Textiles',                     3,  1, NULL, NULL),
  ('demo-dept-04', 'Wood & Metal',                 4,  1, NULL, NULL),
  ('demo-dept-05', 'Digital Media',                5,  1, NULL, NULL),
  ('demo-dept-06', 'Creative Writing',             6,  1, NULL, NULL),
  ('demo-dept-07', 'Ceramics',                     7,  1, NULL, NULL),
  ('demo-dept-08', 'Photo & Film',                 8,  1, NULL, NULL),
  ('demo-dept-09', 'Theatre & Drama',               9,  1, NULL, NULL),
  ('demo-dept-10', 'Nature & Outdoor Life',        10,  1, NULL, NULL),
  ('demo-dept-11', 'Health & Wellness',            11,  1, NULL, NULL),
  ('demo-dept-12', 'Administration & Student Welfare', 12,  0, NULL, NULL);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Profile — fictional staff, fictional contact details
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO Profile (id, userId, name, phone, directPhone, email, bio, imageKey, sortOrder, published, createdAt, updatedAt) VALUES
  ('demo-profile-01', NULL, 'Anna Lindqvist',    '010-123 45 00', '010-123 45 01', 'anna.lindqvist@example.com',
   'Principal since 2019. Passionate about folk education and bringing people together.', 'profiles/demo-01.jpg', 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-02', NULL, 'Erik Svensson',      '010-123 45 00', '010-123 45 02', 'erik.svensson@example.com',
   'Deputy Principal responsible for boarding and student welfare.', 'profiles/demo-02.jpg', 2, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-03', NULL, 'Maria Berg',         '010-123 45 00', '010-123 45 03', 'maria.berg@example.com',
   'Study and Career Counselor. Helps you find the right course and plan your time as a student.', 'profiles/demo-03.jpg', 3, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-04', NULL, 'Johan Karlsson',     '010-123 45 00', '010-123 45 04', 'johan.karlsson@example.com',
   'Student Welfare Officer. Here to talk about anything that feels difficult during your time here.', 'profiles/demo-04.jpg', 4, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-05', NULL, 'Karin Nilsson',      '010-123 45 00', NULL, 'karin.nilsson@example.com',
   'Art teacher focused on painting and drawing.', 'profiles/demo-05.jpg', 5, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-06', NULL, 'Anders Pettersson',  '010-123 45 00', NULL, 'anders.pettersson@example.com',
   'Music teacher. Teaches singing, ensemble playing, and music production.', 'profiles/demo-06.jpg', 6, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-07', NULL, 'Sara Andersson',     '010-123 45 00', NULL, 'sara.andersson@example.com',
   'Textiles teacher with long experience in weaving and knitting.', 'profiles/demo-07.jpg', 7, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-08', NULL, 'Peter Gustafsson',   '010-123 45 00', NULL, 'peter.gustafsson@example.com',
   'Wood & Metal teacher. Enjoys building things that last.', 'profiles/demo-08.jpg', 8, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-09', NULL, 'Lina Holm',          '010-123 45 00', NULL, 'lina.holm@example.com',
   'Digital Media teacher. Teaches digital design and web development.', 'profiles/demo-09.jpg', 9, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-10', NULL, 'Fredrik Åberg',      '010-123 45 00', NULL, 'fredrik.aberg@example.com',
   'Creative Writing teacher. Has published two poetry collections of his own.', 'profiles/demo-10.jpg', 10, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-11', NULL, 'Emma Lundgren',      '010-123 45 00', NULL, 'emma.lundgren@example.com',
   'Ceramics teacher. Also runs her own ceramics studio in her spare time.', 'profiles/demo-11.jpg', 11, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-12', NULL, 'Daniel Ekström',     '010-123 45 00', NULL, 'daniel.ekstrom@example.com',
   'Photo & Film teacher. Worked as a freelance photographer for ten years.', 'profiles/demo-12.jpg', 12, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-13', NULL, 'Sofia Wallin',       '010-123 45 00', NULL, 'sofia.wallin@example.com',
   'Theatre & Drama teacher. Directs the school''s spring production every year.', 'profiles/demo-13.jpg', 13, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-14', NULL, 'Mikael Ström',       '010-123 45 00', NULL, 'mikael.strom@example.com',
   'Nature & Outdoor Life teacher. Happiest outdoors, whatever the weather.', 'profiles/demo-14.jpg', 14, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-profile-15', NULL, 'Jenny Åkesson',      '010-123 45 00', '010-123 45 15', 'jenny.akesson@example.com',
   'Administrator. First point of contact for questions about applications and admissions.', 'profiles/demo-15.jpg', 15, 1, strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. ProfileDepartment — profile ↔ department link + role title (JSON array)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO ProfileDepartment (profileId, departmentId, title, sortOrder) VALUES
  ('demo-profile-01', 'demo-dept-12', '["Principal"]', 1),
  ('demo-profile-02', 'demo-dept-12', '["Deputy Principal"]', 2),
  ('demo-profile-03', 'demo-dept-12', '["Study and Career Counselor"]', 3),
  ('demo-profile-04', 'demo-dept-12', '["Student Welfare Officer"]', 4),
  ('demo-profile-15', 'demo-dept-12', '["Administrator"]', 5),
  ('demo-profile-05', 'demo-dept-01', '["Teacher"]', 1),
  ('demo-profile-06', 'demo-dept-02', '["Teacher"]', 1),
  ('demo-profile-07', 'demo-dept-03', '["Teacher"]', 1),
  ('demo-profile-08', 'demo-dept-04', '["Teacher"]', 1),
  ('demo-profile-09', 'demo-dept-05', '["Teacher"]', 1),
  ('demo-profile-10', 'demo-dept-06', '["Teacher"]', 1),
  ('demo-profile-11', 'demo-dept-07', '["Teacher"]', 1),
  ('demo-profile-12', 'demo-dept-08', '["Teacher"]', 1),
  ('demo-profile-13', 'demo-dept-09', '["Teacher"]', 1),
  ('demo-profile-14', 'demo-dept-10', '["Teacher"]', 1);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. Course — fictional courses (program / short / summer / evening)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO Course (
  id, courseType, deliveryMode, parentKursId, slug, title, excerpt, description, imageKey,
  isPublished, isArchived, duration, studyPace, studyAidLevel, hasAccommodation, accessibilityTags,
  locationText, tracks, infoSections, staff, links, gallery, blocks, headingColor,
  applicationSectionHeading, createdAt, updatedAt
) VALUES
  ('demo-kurs-01', 'program', 'campus', NULL, 'general-course', 'General Course',
   'Complete the qualifications you need for further study, in a safe and supportive environment.',
   'The General Course is for anyone who wants to gain the qualifications needed for university or vocational college. Teaching happens in small groups, with plenty of room for your own questions.',
   'kurser/demo-01.jpg', 1, 0, '1–3 years', 100, 'compulsory', 1, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-02', 'program', 'campus', NULL, 'art-and-design', 'Art and Design',
   'A year focused on your own creative work, technique, and art history.',
   'In Art and Design, you''ll try your hand at painting, drawing, and printmaking while building a portfolio for further art studies.',
   'kurser/demo-02.jpg', 1, 0, '1 year', 100, 'upper_secondary', 1, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-03', 'program', 'campus', NULL, 'creative-writing-program', 'Creative Writing Program',
   'Write short stories, poetry, and longer pieces alongside other aspiring writers.',
   'The Creative Writing Program gives you the tools to develop your own writing, from first idea to finished piece, with regular group feedback.',
   'kurser/demo-03.jpg', 1, 0, '1 year', 100, 'upper_secondary', 0, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-04', 'program', 'outdoor', NULL, 'nature-and-outdoor-life', 'Nature and Outdoor Life',
   'A year outdoors focused on outdoor life, ecology, and leadership in nature.',
   'The course combines hands-on outdoor activities with theory on ecology and conservation, and suits anyone who wants to work in nature guiding or outdoor leadership.',
   'kurser/demo-04.jpg', 1, 0, '1 year', 100, 'upper_secondary', 1, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-05', 'short', 'distance_hybrid', NULL, 'short-course-digital-image-editing', 'Short Course in Digital Image Editing',
   'Two weeks on image editing, layout, and digital design.',
   'A short course for anyone who wants to quickly learn the basics of digital image editing, combining remote sessions with independent study time.',
   'kurser/demo-05.jpg', 1, 0, '2 weeks', 50, 'none', 0, '[]',
   NULL, '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-06', 'short', 'campus', NULL, 'writing-weekend-creative-writing', 'Writing Weekend – Creative Writing',
   'An intensive weekend for anyone who wants to get started with their writing.',
   'Over one weekend, we gather for writing exercises, group discussion, and inspiration alongside experienced writing teachers.',
   'kurser/demo-06.jpg', 1, 0, '1 weekend', NULL, 'none', 0, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Application', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-07', 'summer', 'campus', NULL, 'summer-course-ceramics', 'Summer Course in Ceramics',
   'A week in the clay studio with throwing, glazing, and firing.',
   'Try ceramics from scratch over a summer week — perfect whether you''ve never tried it before or want to go deeper.',
   'kurser/demo-07.jpg', 1, 0, '1 week', NULL, 'none', 1, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Registration', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-08', 'summer', 'campus', NULL, 'summer-course-photography', 'Summer Course in Photography',
   'A week on composition, light, and digital post-processing.',
   'Learn the basics of photography, from camera technique to image editing, in the school''s photo studio and the surrounding nature.',
   'kurser/demo-08.jpg', 1, 0, '1 week', NULL, 'none', 1, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Registration', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-09', 'evening', 'campus', NULL, 'evening-course-watercolor-painting', 'Evening Course in Watercolor Painting',
   'Paint with watercolors one evening a week during the fall.',
   'A relaxed evening course for anyone who wants to learn watercolor technique at their own pace, regardless of prior experience.',
   'kurser/demo-09.jpg', 1, 0, 'Fall term, 1 evening/week', 25, 'none', 0, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Registration', strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-kurs-10', 'evening', 'campus', NULL, 'evening-course-textile-crafts', 'Evening Course in Textile Crafts',
   'Weave, knit, or embroider one evening a week during the spring.',
   'An evening course in textile crafts focused on traditional techniques like weaving, knitting, and embroidery.',
   'kurser/demo-10.jpg', 1, 0, 'Spring term, 1 evening/week', 25, 'none', 0, '[]',
   'Example Folk High School', '[]', '[]', '[]', '[]', '[]', '[]', NULL, 'Registration', strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 4b. CourseDepartment — course ↔ department link (for the CourseGroup block/filter)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO CourseDepartment (courseId, departmentId) VALUES
  ('demo-kurs-02', 'demo-dept-01'),
  ('demo-kurs-03', 'demo-dept-06'),
  ('demo-kurs-04', 'demo-dept-10'),
  ('demo-kurs-05', 'demo-dept-05'),
  ('demo-kurs-06', 'demo-dept-06'),
  ('demo-kurs-07', 'demo-dept-07'),
  ('demo-kurs-08', 'demo-dept-08'),
  ('demo-kurs-09', 'demo-dept-01'),
  ('demo-kurs-10', 'demo-dept-03');


-- ────────────────────────────────────────────────────────────────────────────
-- 5. CourseInstance — course instances (the registration code is generated
--    from year/periodType/week, see src/lib/course-instance.ts)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO CourseInstance (
  id, courseId, slug, year, periodType, week, schoolsoftId, extraFields, sortOrder,
  startDate, endDate, spots, applicationMethods, applicationText, applicationBlocks,
  createdAt, updatedAt
) VALUES
  ('demo-instans-01', 'demo-kurs-01', 'general-course-ak-26-27', 2026, 'full_year', NULL, NULL, '[]', 1,
   strftime('%s','2026-08-17')*1000, strftime('%s','2027-06-11')*1000, 24,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Apply here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-instans-02', 'demo-kurs-01', 'general-course-ak-27-28', 2027, 'full_year', NULL, NULL, '[]', 2,
   strftime('%s','2027-08-16')*1000, strftime('%s','2028-06-09')*1000, 24,
   '{"open":false,"mode":"any","methods":[]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-03', 'demo-kurs-02', 'art-and-design-ak-26-27', 2026, 'full_year', NULL, NULL, '[]', 1,
   strftime('%s','2026-08-17')*1000, strftime('%s','2027-06-11')*1000, 16,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Apply here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-instans-04', 'demo-kurs-02', 'art-and-design-ak-27-28', 2027, 'full_year', NULL, NULL, '[]', 2,
   strftime('%s','2027-08-16')*1000, strftime('%s','2028-06-09')*1000, 16,
   '{"open":false,"mode":"any","methods":[]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-05', 'demo-kurs-03', 'creative-writing-program-ak-26-27', 2026, 'full_year', NULL, NULL, '[]', 1,
   strftime('%s','2026-08-17')*1000, strftime('%s','2027-06-11')*1000, 16,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Apply here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-06', 'demo-kurs-04', 'nature-and-outdoor-life-ak-26-27', 2026, 'full_year', NULL, NULL, '[]', 1,
   strftime('%s','2026-08-17')*1000, strftime('%s','2027-06-11')*1000, 20,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Apply here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-07', 'demo-kurs-05', 'short-course-digital-image-editing-ak-26-ht', 2026, 'fall', NULL, NULL, '[]', 1,
   strftime('%s','2026-10-05')*1000, strftime('%s','2026-10-16')*1000, 12,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Apply here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-08', 'demo-kurs-06', 'writing-weekend-creative-writing-ak-27-vt', 2027, 'spring', NULL, NULL, '[]', 1,
   strftime('%s','2027-03-13')*1000, strftime('%s','2027-03-14')*1000, 15,
   '{"open":false,"mode":"any","methods":[]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-09', 'demo-kurs-07', 'summer-course-ceramics-ak-26-st-v28', 2026, 'summer', 28, NULL, '[]', 1,
   strftime('%s','2026-07-06')*1000, strftime('%s','2026-07-10')*1000, 14,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Register here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-instans-10', 'demo-kurs-07', 'summer-course-ceramics-ak-26-st-v30', 2026, 'summer', 30, NULL, '[]', 2,
   strftime('%s','2026-07-20')*1000, strftime('%s','2026-07-24')*1000, 14,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Register here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-11', 'demo-kurs-08', 'summer-course-photography-ak-26-st-v29', 2026, 'summer', 29, NULL, '[]', 1,
   strftime('%s','2026-07-13')*1000, strftime('%s','2026-07-17')*1000, 12,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Register here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-instans-12', 'demo-kurs-08', 'summer-course-photography-ak-26-st-v31', 2026, 'summer', 31, NULL, '[]', 2,
   strftime('%s','2026-07-27')*1000, strftime('%s','2026-07-31')*1000, 12,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Register here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-13', 'demo-kurs-09', 'evening-course-watercolor-painting-ak-26-ht', 2026, 'fall', NULL, NULL, '[]', 1,
   strftime('%s','2026-09-01')*1000, strftime('%s','2026-12-15')*1000, 12,
   '{"open":true,"mode":"any","methods":[{"type":"form","label":"Register here"}]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-instans-14', 'demo-kurs-10', 'evening-course-textile-crafts-ak-27-vt', 2027, 'spring', NULL, NULL, '[]', 1,
   strftime('%s','2027-01-19')*1000, strftime('%s','2027-05-25')*1000, 12,
   '{"open":false,"mode":"any","methods":[]}', NULL, '[]',
   strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. News — fictional news articles
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO News (id, title, slug, excerpt, content, imageKey, author, links, headingColor, isPublished, publishedAt, createdAt, updatedAt) VALUES
  ('demo-news-01', 'Open House This Fall', 'open-house-this-fall',
   'Come visit us during our open house and meet our teachers and current students.',
   '<p>Join us for an open house on Saturday, September 12. Bring family and friends and discover our workshops, classrooms, and boarding house.</p>',
   NULL, 'The Editorial Team', '[]', NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-news-02', 'A New Course in Digital Image Editing', 'new-digital-image-editing-course',
   'Starting this fall, we''re offering a brand-new short course in digital image editing.',
   '<p>The course is for anyone who wants to learn the basics of image editing and digital design, combining remote sessions with independent study time.</p>',
   NULL, 'The Editorial Team', '[]', NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-news-03', 'Summer Courses Are Now Open for Registration', 'summer-courses-open-for-registration',
   'You can now sign up for this year''s summer courses in ceramics and photography.',
   '<p>Spots tend to fill up fast, so don''t wait too long to register. Read more under each course.</p>',
   NULL, 'The Editorial Team', '[]', NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-news-04', 'Renovated Boarding House Ready for Fall', 'renovated-boarding-house-ready-for-fall',
   'Over the summer, we renovated parts of the boarding house with new kitchens and common areas.',
   '<p>We hope the new spaces will make everyday life even more comfortable for our students.</p>',
   NULL, 'Facilities', '[]', NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-news-05', 'This Year''s Culture Week', 'culture-week',
   'A week full of performances, exhibitions, and concerts created by our students.',
   '<p>Culture Week wraps up with a joint performance in the auditorium, open to the public.</p>',
   NULL, 'The Editorial Team', '[]', NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 7. ParticipantStory — fictional student stories (first names only)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO ParticipantStory (id, name, graduationYear, courseName, story, imageKey, programId, summerCourseId, published, createdAt, updatedAt) VALUES
  ('demo-story-01', 'Elin', 2025, 'Art and Design',
   'The year in Art and Design gave me the courage to apply to art school. I learned as much about myself as I did about painting.',
   'participant-portraits/demo-01.jpg', NULL, NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-story-02', 'Noah', 2024, 'General Course',
   'I never thought I''d enjoy being back in school this much. Here, I found the calm and focus I needed to raise my grades.',
   'participant-portraits/demo-02.jpg', NULL, NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-story-03', 'Amanda', 2025, 'Creative Writing Program',
   'The Creative Writing Program taught me to take my own writing seriously. A year after graduating, I still write every day.',
   'participant-portraits/demo-03.jpg', NULL, NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-story-04', 'Viktor', 2023, 'Nature and Outdoor Life',
   'I went from never having slept in a tent to working as an outdoor leader. It all started here.',
   'participant-portraits/demo-04.jpg', NULL, NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-story-05', 'Saga', 2025, 'Summer Course in Ceramics',
   'One week in the clay studio was all it took to hook me completely. Now I''m considering applying for a longer program in ceramics.',
   'participant-portraits/demo-05.jpg', NULL, NULL, 1, strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. WeeklyMenu / DayMenu / DayMenuItem / Dish — one fictional week's menu
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO Dish (id, name, description, allergens, imageKey, price, studentPrice, vegetarian, vegan, createdAt, updatedAt) VALUES
  ('demo-dish-01', 'Meatballs with mashed potatoes', 'Served with lingonberry jam and cream sauce.', 'Milk, gluten', NULL, 55, 45, 0, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-02', 'Vegetarian lasagna', 'Classic lasagna with lentils and vegetables.', 'Milk, gluten', NULL, 55, 45, 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-03', 'Fruit salad', 'Seasonal fruit.', NULL, NULL, 25, 20, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-04', 'Fish gratin', 'Oven-baked fish gratin with dill sauce.', 'Fish, milk', NULL, 55, 45, 0, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-05', 'Vegetable stir-fry', 'Stir-fried seasonal vegetables with rice.', 'Soy', NULL, 55, 45, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-06', 'Pancakes with jam', 'Classic pancakes with jam and cream.', 'Milk, gluten, eggs', NULL, 25, 20, 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-07', 'Chicken stew', 'Chicken stew with root vegetables.', NULL, NULL, 55, 45, 0, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-08', 'Halloumi stir-fry', 'Stir-fried halloumi with vegetables and noodles.', 'Milk, gluten', NULL, 55, 45, 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-09', 'Chocolate pudding', 'Dark chocolate pudding with whipped cream.', 'Milk, eggs', NULL, 25, 20, 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-10', 'Pasta with tomato sauce', 'Pasta with homemade tomato sauce and basil.', 'Gluten', NULL, 55, 45, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-11', 'Oven-baked salmon', 'Oven-baked salmon with lemon and herbs.', 'Fish', NULL, 65, 55, 0, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-12', 'Vegetable soup', 'Warm vegetable soup with bread.', 'Gluten', NULL, 45, 35, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-13', 'Pizza buffet', 'Homemade pizza with your choice of toppings.', 'Gluten, milk', NULL, 55, 45, 0, 0, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-14', 'Salad bar', 'Large salad buffet with sides.', NULL, NULL, 45, 35, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('demo-dish-15', 'Vanilla ice cream with berries', 'Vanilla ice cream with seasonal berries.', 'Milk', NULL, 25, 20, 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR REPLACE INTO WeeklyMenu (id, week, year, notes, footer, published, createdAt, updatedAt) VALUES
  ('demo-menu-01', 28, 2026, NULL, 'Subject to change.', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR REPLACE INTO DayMenu (id, weeklyMenuId, day, closed) VALUES
  ('demo-daymenu-01', 'demo-menu-01', 1, 0),
  ('demo-daymenu-02', 'demo-menu-01', 2, 0),
  ('demo-daymenu-03', 'demo-menu-01', 3, 0),
  ('demo-daymenu-04', 'demo-menu-01', 4, 0),
  ('demo-daymenu-05', 'demo-menu-01', 5, 0);

INSERT OR REPLACE INTO DayMenuItem (id, dayMenuId, dishId, sortOrder) VALUES
  ('demo-item-01', 'demo-daymenu-01', 'demo-dish-01', 1),
  ('demo-item-02', 'demo-daymenu-01', 'demo-dish-02', 2),
  ('demo-item-03', 'demo-daymenu-01', 'demo-dish-03', 3),
  ('demo-item-04', 'demo-daymenu-02', 'demo-dish-04', 1),
  ('demo-item-05', 'demo-daymenu-02', 'demo-dish-05', 2),
  ('demo-item-06', 'demo-daymenu-02', 'demo-dish-06', 3),
  ('demo-item-07', 'demo-daymenu-03', 'demo-dish-07', 1),
  ('demo-item-08', 'demo-daymenu-03', 'demo-dish-08', 2),
  ('demo-item-09', 'demo-daymenu-03', 'demo-dish-09', 3),
  ('demo-item-10', 'demo-daymenu-04', 'demo-dish-10', 1),
  ('demo-item-11', 'demo-daymenu-04', 'demo-dish-11', 2),
  ('demo-item-12', 'demo-daymenu-04', 'demo-dish-12', 3),
  ('demo-item-13', 'demo-daymenu-05', 'demo-dish-13', 1),
  ('demo-item-14', 'demo-daymenu-05', 'demo-dish-14', 2),
  ('demo-item-15', 'demo-daymenu-05', 'demo-dish-15', 3);


-- ────────────────────────────────────────────────────────────────────────────
-- 9. Venue — fictional bookable venues (Meeting Place)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO Venue (id, name, slug, description, category, capacity, priceInfo, availableTo, features, imageKey, blocks, headingColor, sortOrder, published, createdAt, updatedAt) VALUES
  ('demo-venue-01', 'Ekbacken Conference Room', 'ekbacken-conference-room',
   'A smaller conference room with round tables, perfect for meetings and workshops.',
   'Conference Room', 12, '800 SEK / half day', 'organizations', '["Projector","Whiteboard","Wi-Fi"]',
   'venues/demo-01.jpg', '[]', NULL, 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-venue-02', 'Auditorium', 'auditorium',
   'The school''s large auditorium, used for performances, conferences, and larger gatherings.',
   'Event Venue', 150, '2,500 SEK / half day', 'all', '["Stage","Sound & lighting","Projector"]',
   'venues/demo-02.jpg', '[]', NULL, 2, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-venue-03', 'Sports Hall', 'sports-hall',
   'A full-size sports hall available to book for training, matches, and events.',
   'Sports Hall', 80, '1,200 SEK / half day', 'organizations', '["Changing rooms","Spectator stands"]',
   'venues/demo-03.jpg', '[]', NULL, 3, 1, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-venue-04', 'Weaving Room', 'weaving-room',
   'A cozy workshop space with looms, ideal for courses and creative events.',
   'Other', 15, '600 SEK / half day', 'organizations', '["Looms","Good natural light"]',
   'venues/demo-04.jpg', '[]', NULL, 4, 1, strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 10. ErrorReport — fictional maintenance reports (mixed status/category)
--     The "category" values ('electrical', 'plumbing', 'cleaning', 'it',
--     'other') and "priority" values ('low', 'medium', 'high') must match
--     the option lists hardcoded in
--     src/app/about/report-issue/report-issue-client.tsx.
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO ErrorReport (
  id, title, description, location, building, room, allowEntry, category, priority, status,
  assignedTo, senderName, senderEmail, senderPhone, imageKey, reportedBy, resolvedAt, createdAt, updatedAt
) VALUES
  ('demo-error-01', 'Broken light in Corridor B', 'The ceiling light flickers and sometimes goes out completely.',
   'Corridor B', 'Main Building', 'Corridor B', 0, 'electrical', 'medium', 'open',
   'facilities', 'Test Testerson', 'test.testerson@example.com', '070-000 00 01', NULL, NULL, NULL,
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-error-02', 'Leaking faucet in the kitchen', 'The faucet by the sink drips constantly, wasting a lot of water.',
   'Student Kitchen', 'Boarding House', 'Kitchen 2', 1, 'plumbing', 'high', 'in-progress',
   'facilities', 'Sample Sampleson', 'sample.sampleson@example.com', '070-000 00 02', NULL, NULL, NULL,
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-error-03', 'Slow Wi-Fi in the boarding house', 'The Wi-Fi signal is very weak in several rooms on the second floor.',
   'Second Floor', 'Boarding House', '', 1, 'it', 'low', 'resolved',
   'incident', 'Example Exampleson', 'example.exampleson@example.com', '070-000 00 03', NULL, NULL,
   strftime('%s','2026-06-20')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-error-04', 'Damaged projector in Room 3', 'The projector in Room 3 turns on but shows no picture.',
   'Room 3', 'Main Building', 'Room 3', 0, 'it', 'medium', 'open',
   'incident', 'Anna Andersson', 'anna.andersson@example.com', '070-000 00 04', NULL, NULL, NULL,
   strftime('%s','now')*1000, strftime('%s','now')*1000),

  ('demo-error-05', 'Mess left in the common room', 'Lots of trash and dirty dishes left in the common room after the weekend.',
   'Common Room', 'Boarding House', '', 1, 'other', 'low', 'resolved',
   'facilities', 'Erik Eriksson', 'erik.eriksson@example.com', '070-000 00 05', NULL, NULL,
   strftime('%s','2026-06-15')*1000, strftime('%s','now')*1000, strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 11. CourseApplication — fictional course applications (note: obviously
--     fake personal ID numbers in the format YYYYMMDD-XXXX, no real personal
--     identification numbers)
-- ────────────────────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO CourseApplication (
  id, instanceId, registrationCode, courseTitle, schoolsoftId, firstName, lastName, personalNumber,
  email, phone, address, postalCode, city, priorEducation, motivation, extraAnswers, attachments, status, createdAt
) VALUES
  ('demo-application-01', 'demo-instans-01', 'AK 26/27', 'General Course', NULL,
   'Lina', 'Johansson', '19000101-0000', 'lina.johansson@example.com', '070-000 01 00',
   '1 Example Street', '281 00', 'Example Town', 'Compulsory school',
   'I want to complete my qualifications so I can apply to university.',
   '{}', '[]', 'new', strftime('%s','now')*1000),

  ('demo-application-02', 'demo-instans-09', 'AK 26 ST, v28', 'Summer Course in Ceramics', NULL,
   'Oskar', 'Bergström', '19000101-0001', 'oskar.bergstrom@example.com', '070-000 01 01',
   '2 Test Street', '281 01', 'Example Town', 'Upper secondary school',
   'I''ve always wanted to try ceramics, and a summer week sounded perfect.',
   '{}', '[]', 'reviewing', strftime('%s','now')*1000),

  ('demo-application-03', 'demo-instans-13', 'AK 26 HT', 'Evening Course in Watercolor Painting', NULL,
   'Maja', 'Sundqvist', '19000101-0002', 'maja.sundqvist@example.com', '070-000 01 02',
   '3 Sample Street', '281 02', 'Example Town', 'Post-secondary education',
   'I paint in my spare time and want to develop my watercolor technique together with others.',
   '{}', '[]', 'accepted', strftime('%s','now')*1000);


-- ────────────────────────────────────────────────────────────────────────────
-- 12. Singleton CMS content tables — one row per table, id = 'main'
--     (same convention already used in API routes, see e.g.
--     src/app/api/kontakt/content/route.ts)
--
--     NOTE: Several of these tables already have their 'main' row created
--     directly by the migration files themselves (INSERT/INSERT OR IGNORE in
--     e.g. 0015, 0040, 0051, 0052, 0061, 0062, 0067) — so they are NOT empty
--     in a freshly migrated database, unlike what was assumed in the brief.
--     Migration 0015 (KontaktContent) also contains the school's ACTUAL
--     address/phone/email as a leftover in the migration history. These
--     seven tables therefore use INSERT OR REPLACE below so the script
--     overwrites the existing row with fictional demo content: ContactContent,
--     SummerCoursesAdmissionsContent, SummerCoursesContent,
--     SummerCoursesPracticalInfoContent, NatureLifeCoursesContent,
--     NavHubContent, VenuesContent.
-- ────────────────────────────────────────────────────────────────────────────

INSERT OR REPLACE INTO HomeContent (id, heading, headingVisible, headingColor, heroIngress, whyUsText, whyUsHeading, whyUsHeadingVisible, blocks, updatedAt) VALUES
  ('main', 'Welcome to Example Folk High School', 0, NULL,
   'A place to grow, create, and find your path forward.',
   'Here, you''ll find small groups, dedicated teachers, and a wide range of courses in art, writing, nature, and much more.',
   'Why choose us?', 1, '[]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO ContactContent (id, addressStreet, addressCity, phone, email, invoiceEmail, invoiceNote, bankgiro, officeHours, absenceNotice, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', '12 School Road', '281 00 Example Town', '010-123 45 00', 'info@example.com',
   'invoicing@example.com', '', '123-4567', 'Mon–Fri 08:00–16:00',
   'Report absences to your mentor or the front office.', 'Contact Us', 1, NULL, '[]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO HistoryContent (id, sections, heading, headingVisible, headingColor, blocks, timeline, updatedAt) VALUES
  ('main', '[]', 'Our History', 1, NULL,
   '[{"id":"demo-blk-historia-01","type":"section","heading":"A School Steeped in History","headingVisible":true,"body":"<p>The school was founded by a group of passionate local advocates who wanted to create a gathering place for folk education in the area. Since then, it has grown steadily.</p>"}]',
   '[{"id":"demo-tl-01","year":1950,"text":"The school is founded by a local folk education association.","images":[]},{"id":"demo-tl-02","year":1990,"text":"The boarding house is expanded to meet growing student numbers.","images":[]},{"id":"demo-tl-03","year":2020,"text":"New workshops for art, ceramics, and photography open.","images":[]}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO CareersContent (id, sections, heading, headingVisible, headingColor, blocks, sidebarProfileIds, updatedAt) VALUES
  ('main', '[]', 'Job Openings', 1, NULL,
   '[{"id":"demo-blk-jobb-01","type":"section","heading":"Right Now","headingVisible":true,"body":"<p>We don''t have any open positions right now, but feel free to send us a speculative application.</p>"}]',
   '["demo-profile-01"]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO StudentRightsContent (id, sections, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', '[]', 'Student Rights', 1, NULL,
   '[{"id":"demo-blk-studeranderatt-01","type":"section","heading":"Your Rights","headingVisible":true,"body":"<p>As a student with us, you have the right to a safe learning environment, a say in your education, and access to student welfare support.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO StudentSupportContent (id, sections, heading, headingVisible, headingColor, blocks, sidebarProfileIds, updatedAt) VALUES
  ('main', '[]', 'Student Welfare Support', 1, NULL,
   '[{"id":"demo-blk-kurativt-01","type":"section","heading":"We''re Here for You","headingVisible":true,"body":"<p>The school''s Student Welfare Officer is available for one-on-one conversations about anything that feels difficult during your time here.</p>"}]',
   '["demo-profile-04"]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO StudyGuidanceContent (id, sections, heading, headingVisible, headingColor, blocks, sidebarProfileIds, updatedAt) VALUES
  ('main', '[]', 'Study and Career Guidance', 1, NULL,
   '[{"id":"demo-blk-sv-01","type":"section","heading":"Book a Meeting","headingVisible":true,"body":"<p>Our Study and Career Counselor helps you plan your studies and see what awaits after your time with us.</p>"}]',
   '["demo-profile-03"]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO TermDatesContent (id, sections, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', '[]', 'Term Dates and School Holidays', 1, NULL,
   '[{"id":"demo-blk-lovtider-01","type":"section","heading":"The 2026/2027 School Year","headingVisible":true,"body":"<p>The fall term starts on August 17, 2026. The spring term ends on June 11, 2027. See the separate schedule for holidays during the year.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO AdmissionsContent (id, sections, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', '[]', 'Application Periods', 1, NULL,
   '[{"id":"demo-blk-ansokan-01","type":"section","heading":"How to Apply","headingVisible":true,"body":"<p>Applications to our programs are accepted on a rolling basis, but we recommend applying as early as possible ahead of the fall term.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO SummerCoursesAdmissionsContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Summer Course Applications', 1, NULL,
   '[{"id":"demo-blk-ansokan-sommar-01","type":"section","heading":"Registration Open","headingVisible":true,"body":"<p>Register for one or more summer courses directly on each course page.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO BoardingContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Boarding', 1, NULL,
   '[{"id":"demo-blk-internat-01","type":"section","heading":"Housing During Your Course","headingVisible":true,"body":"<p>We offer housing at the school''s boarding house for students enrolled in a program or a longer course with us.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO FolkEducationContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Folk Education', 1, NULL,
   '[{"id":"demo-blk-folkbildning-01","type":"section","heading":"What Is Folk Education?","headingVisible":true,"body":"<p>Folk education is about free, voluntary learning without grades, for anyone who wants to grow together with others.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO AssociationContent (id, sections, heading, headingVisible, headingColor, blocks, mapHeading, buildings, boardHeading, boardIntro, updatedAt) VALUES
  ('main', '[]', 'The Association', 1, NULL,
   '[{"id":"demo-blk-foreningen-01","type":"section","heading":"The School Is Run as an Association","headingVisible":true,"body":"<p>Example Folk High School is run by a non-profit association with roots in the local folk education movement.</p>"}]',
   'The School''s Buildings', 'The school''s grounds include the main building, the boarding house, and several standalone workshops.',
   'The Board', 'The board is made up of elected members who meet regularly throughout the year.',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO SummerCoursesContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Summer Courses', 1, NULL,
   '[{"id":"demo-blk-sommarkurser-01","type":"section","heading":"A Summer to Remember","headingVisible":true,"body":"<p>Our summer courses run for one week and are perfect if you want to try something new together with others.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO SummerCoursesPracticalInfoContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Practical Information', 1, NULL,
   '[{"id":"demo-blk-praktisk-sommar-01","type":"section","heading":"Good to Know","headingVisible":true,"body":"<p>Bring your own work clothes; materials are listed on each course page. Housing is included if you''re staying at the boarding house.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO NatureLifeCoursesContent (id, departmentId, heading, headingVisible, headingColor, imageKey, blocks, updatedAt) VALUES
  ('main', 'demo-dept-10', 'Nature Life Courses', 1, NULL, NULL,
   '[{"id":"demo-blk-naturliv-01","type":"section","heading":"Learn in Nature","headingVisible":true,"body":"<p>Our nature life courses combine hands-on outdoor activities with theory on ecology and conservation.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO EveningCoursesContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Evening Courses', 1, NULL,
   '[{"id":"demo-blk-kvallskurser-01","type":"section","heading":"Study in the Evening","headingVisible":true,"body":"<p>Our evening courses are perfect if you want to combine a course with work or other studies.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO NewsHubContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'News', 1, NULL, '[]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO ParticipantStoriesContent (id, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Student Stories', 1, NULL,
   '[{"id":"demo-blk-berattelser-01","type":"section","heading":"Voices From Our Students","headingVisible":true,"body":"<p>Read about how other students have experienced their time with us.</p>"}]',
   strftime('%s','now')*1000);

INSERT OR REPLACE INTO MaintenanceReportContent (id, intro, heading, headingVisible, headingColor, blocks, updatedAt) VALUES
  ('main', 'Report faults and issues with facilities or equipment. We will handle your report as soon as possible.',
   'Maintenance Report', 1, NULL, '[]', strftime('%s','now')*1000);

INSERT OR REPLACE INTO NavHubContent (id, heading, headingVisible, headingColor, ingress, links, blocks) VALUES
  ('utbildningar', 'Education Programs', 1, NULL, 'Our programs for anyone who wants to pursue a longer course of study with us.', '[]',
   '[{"id":"demo-blk-hub-utb-01","type":"section","heading":"Find Your Program","headingVisible":true,"body":"<p>We offer several programs, including the General Course, Art and Design, Creative Writing, and Nature and Outdoor Life.</p>"}]'),
  ('kortkurser', 'Short Courses', 1, NULL, 'Shorter courses, summer courses, and evening courses for anyone who wants to try something new.', '[]',
   '[{"id":"demo-blk-hub-kort-01","type":"section","heading":"Try Something New","headingVisible":true,"body":"<p>From intensive weekend courses to summer weeks and evening classes during the term.</p>"}]'),
  ('skolan', 'The School', 1, NULL, 'Everything about Example Folk High School — practical information, housing, venues, and more.', '[]',
   '[{"id":"demo-blk-hub-skolan-01","type":"section","heading":"About the School","headingVisible":true,"body":"<p>Here you''ll find information about our association, history, boarding house, and support for students.</p>"}]');

INSERT OR REPLACE INTO VenuesContent (id, heading, headingVisible, headingColor, blocks) VALUES
  ('main', 'Venues', 1, NULL,
   '[{"id":"demo-blk-motesplats-01","type":"section","heading":"Book a Venue","headingVisible":true,"body":"<p>The school''s venues can be booked for meetings, conferences, and events when they''re not being used for teaching.</p>"}]');

INSERT OR REPLACE INTO BgGradientSettings (id, color1, color2, favorite1, favorite2, favorite3, updatedAt) VALUES
  ('main', '#FDFCF8', '#F7F4ED', NULL, NULL, NULL, strftime('%s','now')*1000);

INSERT OR REPLACE INTO TypographySettings (id, h1Font, h2Font, h3Font, bodyFont, locked, preset2, preset3, updatedAt) VALUES
  ('main', 'Geist', 'Geist', 'Geist', 'Geist', 0, NULL, NULL, strftime('%s','now')*1000);

-- RestaurantContent — not explicitly requested in the original brief, but a
-- singleton with no DB default that's required for /restaurant to show
-- something sensible.
INSERT OR REPLACE INTO RestaurantContent (id, intro, pricesNote, defaultMenuFooter, updatedAt) VALUES
  ('main', 'A warm welcome to the Restaurant, where each day''s menu is cooked from scratch.',
   'Prices apply to external guests. Students and staff pay a reduced rate.',
   'Subject to change.', strftime('%s','now')*1000);

-- ============================================================================
-- End of seed-demo-data.sql
-- ============================================================================
