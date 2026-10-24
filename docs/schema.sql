-- Generated from the Sequelize models (server/models). Do not edit by hand.
-- Engine/charset: InnoDB, utf8mb4_unicode_ci.

CREATE TABLE IF NOT EXISTS `academic_sessions` (`id` INTEGER UNSIGNED auto_increment , `name` VARCHAR(40) NOT NULL UNIQUE, `start_date` DATE NOT NULL, `end_date` DATE NOT NULL, `is_current` TINYINT(1) NOT NULL DEFAULT false, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faculty` (`id` INTEGER UNSIGNED auto_increment , `code` VARCHAR(16) NOT NULL UNIQUE, `name` VARCHAR(80) NOT NULL, `email` VARCHAR(120), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff` (`id` INTEGER UNSIGNED auto_increment , `code` VARCHAR(16) NOT NULL UNIQUE, `name` VARCHAR(80) NOT NULL, `role` VARCHAR(80) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courses` (`id` INTEGER UNSIGNED auto_increment , `code` VARCHAR(24) NOT NULL UNIQUE, `title` VARCHAR(120) NOT NULL, `credit_hrs` TINYINT UNSIGNED NOT NULL, `kind` ENUM('TH', 'LAB') NOT NULL, `category` VARCHAR(40) NOT NULL, `prereq_code` VARCHAR(24), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `programs` (`id` INTEGER UNSIGNED auto_increment , `code` VARCHAR(16) NOT NULL UNIQUE, `name` VARCHAR(120) NOT NULL, `degree_years` TINYINT UNSIGNED NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curriculum` (`program_id` INTEGER UNSIGNED NOT NULL , `course_id` INTEGER UNSIGNED NOT NULL , `semester_no` TINYINT UNSIGNED NOT NULL, `requirement` VARCHAR(16) NOT NULL DEFAULT 'Core', PRIMARY KEY (`program_id`, `course_id`), FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sections` (`id` INTEGER UNSIGNED auto_increment , `course_id` INTEGER UNSIGNED NOT NULL, `session_id` INTEGER UNSIGNED NOT NULL, `faculty_id` INTEGER UNSIGNED, `code` VARCHAR(80) NOT NULL UNIQUE, `scheduled` SMALLINT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (`id`), FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sections` ADD INDEX `sections_session_id` (`session_id`);

CREATE TABLE IF NOT EXISTS `timetable_slots` (`id` INTEGER UNSIGNED auto_increment , `section_id` INTEGER UNSIGNED NOT NULL, `day` ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL, `start_time` VARCHAR(5) NOT NULL, `end_time` VARCHAR(5) NOT NULL, `room` VARCHAR(60) NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `timetable_slots` ADD INDEX `timetable_slots_section_id` (`section_id`);

CREATE TABLE IF NOT EXISTS `students` (`id` INTEGER UNSIGNED auto_increment , `reg_no` VARCHAR(24) NOT NULL UNIQUE, `enrollment_no` VARCHAR(40) NOT NULL UNIQUE, `password_hash` VARCHAR(100) NOT NULL, `full_name` VARCHAR(100) NOT NULL, `program_id` INTEGER UNSIGNED NOT NULL, `section_label` VARCHAR(4) NOT NULL DEFAULT 'A', `status` VARCHAR(20) NOT NULL DEFAULT 'Active', `dob` DATE, `nic` VARCHAR(20), `gender` VARCHAR(10), `failed_logins` TINYINT UNSIGNED NOT NULL DEFAULT 0, `locked_until` DATETIME, PRIMARY KEY (`id`), FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_profiles` (`student_id` INTEGER UNSIGNED NOT NULL , `tax_payee_name` VARCHAR(80), `tax_payee_nic` VARCHAR(20), `self_payee` TINYINT(1) DEFAULT false, `ntn_number` VARCHAR(20), `is_filer` TINYINT(1) DEFAULT false, `guardian_relation` VARCHAR(20), `guardian_name` VARCHAR(80), `guardian_occupation` VARCHAR(80), `guardian_cell` VARCHAR(24), `guardian_cnic` VARCHAR(20), `guardian_email` VARCHAR(120), `permanent_address` VARCHAR(200), `present_address` VARCHAR(200), `cell` VARCHAR(24), `personal_email` VARCHAR(120), `official_email` VARCHAR(120), `cnic` VARCHAR(20), `avatar` MEDIUMBLOB, `avatar_type` VARCHAR(20), `updated_at` DATETIME NOT NULL, PRIMARY KEY (`student_id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enrollments` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `section_id` INTEGER UNSIGNED NOT NULL, `course_id` INTEGER UNSIGNED NOT NULL, `session_id` INTEGER UNSIGNED NOT NULL, `status` ENUM('IN_PROG', 'PASS', 'SUB_PASS', 'FAIL', 'WITHDRAWN', 'PENDING') NOT NULL DEFAULT 'IN_PROG', `grade` VARCHAR(3), `grade_pts` DECIMAL(3,2), PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `enrollments` ADD UNIQUE INDEX `enrollments_student_id_section_id` (`student_id`, `section_id`);

ALTER TABLE `enrollments` ADD INDEX `enrollments_student_id_session_id` (`student_id`, `session_id`);

CREATE TABLE IF NOT EXISTS `attendance_records` (`id` INTEGER UNSIGNED auto_increment , `enrollment_id` INTEGER UNSIGNED NOT NULL, `held_on` DATE NOT NULL, `topic` VARCHAR(80) NOT NULL DEFAULT '', `present` TINYINT(1) NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `attendance_records` ADD UNIQUE INDEX `attendance_records_enrollment_id_held_on_topic` (`enrollment_id`, `held_on`, `topic`);

CREATE TABLE IF NOT EXISTS `plo_scores` (`enrollment_id` INTEGER UNSIGNED NOT NULL , `so_no` TINYINT UNSIGNED , `percent` DECIMAL(5,2) NOT NULL, `weight` DECIMAL(4,2) NOT NULL, PRIMARY KEY (`enrollment_id`, `so_no`), FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assessments` (`id` INTEGER UNSIGNED auto_increment , `section_id` INTEGER UNSIGNED NOT NULL, `kind` VARCHAR(30) NOT NULL, `name` VARCHAR(60) NOT NULL, `total` DECIMAL(6,2) NOT NULL, `passing` DECIMAL(6,2) NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `assessments` ADD INDEX `assessments_section_id` (`section_id`);

CREATE TABLE IF NOT EXISTS `assessment_marks` (`assessment_id` INTEGER UNSIGNED NOT NULL , `student_id` INTEGER UNSIGNED NOT NULL , `obtained` DECIMAL(6,2) NOT NULL, PRIMARY KEY (`assessment_id`, `student_id`), FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exam_papers` (`id` INTEGER UNSIGNED auto_increment , `section_id` INTEGER UNSIGNED NOT NULL, `kind` ENUM('MID', 'FINAL', 'LAB') NOT NULL, `exam_date` DATE NOT NULL, `start_time` VARCHAR(5) NOT NULL, `end_time` VARCHAR(5) NOT NULL, `room` VARCHAR(60) NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seat_allocations` (`paper_id` INTEGER UNSIGNED NOT NULL , `student_id` INTEGER UNSIGNED NOT NULL , `seat_no` VARCHAR(12) NOT NULL, PRIMARY KEY (`paper_id`, `student_id`), FOREIGN KEY (`paper_id`) REFERENCES `exam_papers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `online_exams` (`id` INTEGER UNSIGNED auto_increment , `section_id` INTEGER UNSIGNED NOT NULL, `title` VARCHAR(120) NOT NULL, `opens_at` DATETIME NOT NULL, `closes_at` DATETIME NOT NULL, `duration_min` SMALLINT UNSIGNED NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roadmap_verifications` (`student_id` INTEGER UNSIGNED NOT NULL , `verified` TINYINT(1) NOT NULL DEFAULT false, `comments` VARCHAR(500), `updated_at` DATETIME NOT NULL, PRIMARY KEY (`student_id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ledger_entries` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `session_id` INTEGER UNSIGNED, `posted_on` DATE NOT NULL, `description` VARCHAR(200) NOT NULL, `fee_nature` VARCHAR(60) NOT NULL, `debit` DECIMAL(12,2) NOT NULL DEFAULT 0, `credit` DECIMAL(12,2) NOT NULL DEFAULT 0, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ledger_entries` ADD INDEX `ledger_entries_student_id_posted_on_id` (`student_id`, `posted_on`, `id`);

CREATE TABLE IF NOT EXISTS `advance_receipts` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `receipt_no` VARCHAR(40) NOT NULL UNIQUE, `received_on` DATE NOT NULL, `amount` DECIMAL(12,2) NOT NULL DEFAULT 0, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `advance_receipts` ADD INDEX `advance_receipts_student_id` (`student_id`);

CREATE TABLE IF NOT EXISTS `todos` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `task` VARCHAR(200) NOT NULL, `due_date` DATE, `active` TINYINT(1) NOT NULL DEFAULT true, `status` ENUM('Not Started', 'In Progress', 'Completed') NOT NULL DEFAULT 'Not Started', `priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium', `created_at` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `todos` ADD INDEX `todos_student_id` (`student_id`);

CREATE TABLE IF NOT EXISTS `messages` (`id` INTEGER UNSIGNED auto_increment , `owner_id` INTEGER UNSIGNED NOT NULL, `box` ENUM('inbox', 'sent') NOT NULL, `party_name` VARCHAR(255) NOT NULL, `party_role` VARCHAR(40) NOT NULL, `subject` VARCHAR(120) NOT NULL, `body` TEXT NOT NULL, `comm_type` VARCHAR(30) NOT NULL DEFAULT 'Announcement', `priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low', `category` VARCHAR(40) NOT NULL DEFAULT 'Information', `due_date` DATE, `follow_up` TINYINT(1) NOT NULL DEFAULT false, `reminder` TINYINT(1) NOT NULL DEFAULT false, `read_at` DATETIME, `created_at` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`owner_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `messages` ADD INDEX `messages_owner_id_box_created_at` (`owner_id`, `box`, `created_at`);

CREATE TABLE IF NOT EXISTS `workflows` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `session_id` INTEGER UNSIGNED, `kind` ENUM('Course Withdrawal', 'Semester Freeze', 'Transcript Request', 'Section Change', 'Other') NOT NULL, `due_date` DATE, `description` VARCHAR(1000) NOT NULL, `status` ENUM('Draft', 'Submitted', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft', `final_submitted` TINYINT(1) NOT NULL DEFAULT false, `created_at` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `workflows` ADD INDEX `workflows_student_id` (`student_id`);

CREATE TABLE IF NOT EXISTS `announcements` (`id` INTEGER UNSIGNED auto_increment , `title` VARCHAR(200) NOT NULL, `body` TEXT NOT NULL, `posted_on` DATE NOT NULL, `author` VARCHAR(80) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `surveys` (`id` INTEGER UNSIGNED auto_increment , `kind` ENUM('Feedback', 'Survey') NOT NULL, `title` VARCHAR(200) NOT NULL, `section_id` INTEGER UNSIGNED, `opens_on` DATE NOT NULL, `closes_on` DATE NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `survey_responses` (`survey_id` INTEGER UNSIGNED NOT NULL , `student_id` INTEGER UNSIGNED NOT NULL , `rating` TINYINT UNSIGNED NOT NULL, `comment` VARCHAR(1000), `submitted_at` DATETIME NOT NULL, PRIMARY KEY (`survey_id`, `student_id`), FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_log` (`id` INTEGER UNSIGNED auto_increment , `student_id` INTEGER UNSIGNED NOT NULL, `action` VARCHAR(40) NOT NULL, `detail` VARCHAR(200) NOT NULL, `ip` VARCHAR(64), `created_at` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_log` ADD INDEX `activity_log_student_id_created_at` (`student_id`, `created_at`);

CREATE TABLE IF NOT EXISTS `registration_windows` (`id` INTEGER UNSIGNED auto_increment , `session_id` INTEGER UNSIGNED NOT NULL, `program_id` INTEGER UNSIGNED NOT NULL, `semester_no` TINYINT UNSIGNED NOT NULL, `min_credits` TINYINT UNSIGNED NOT NULL, `max_credits` TINYINT UNSIGNED NOT NULL, `opens_on` DATE NOT NULL, `closes_on` DATE NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `registration_windows` ADD UNIQUE INDEX `registration_windows_session_id_program_id` (`session_id`, `program_id`);

CREATE TABLE IF NOT EXISTS `auth_sessions` (`id` CHAR(36) BINARY , `student_id` INTEGER UNSIGNED NOT NULL, `refresh_hash` CHAR(64) NOT NULL UNIQUE, `prev_refresh_hash` CHAR(64), `rotated_at` DATETIME, `expires_at` DATETIME NOT NULL, `revoked_at` DATETIME, `ip` VARCHAR(64), `user_agent` VARCHAR(200), `created_at` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `auth_sessions` ADD INDEX `auth_sessions_student_id` (`student_id`);

ALTER TABLE `auth_sessions` ADD INDEX `auth_sessions_expires_at` (`expires_at`);

ALTER TABLE `auth_sessions` ADD INDEX `auth_sessions_prev_refresh_hash` (`prev_refresh_hash`);

