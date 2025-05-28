-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2025 at 03:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `notes_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `pinned` tinyint(1) DEFAULT 0,
  `is_locked` tinyint(1) DEFAULT 0,
  `created_at` bigint(20) UNSIGNED DEFAULT unix_timestamp(),
  `password_hash` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notes`
--

INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `color`, `pinned`, `is_locked`, `created_at`, `password_hash`, `file_url`) VALUES
(2, 1, 'Second Note', 'More text for the second note.', '#16b192', 0, 0, 1700000000, NULL, NULL),
(4, 1, 'Meeting Notes', 'Discussed project timeline, assigned tasks.', '#d2cc19', 0, 0, 1701000000, NULL, NULL),
(5, 1, 'Shopping List', 'Eggs, Bread, Milk, Coffee', '#62c520', 0, 0, 1702000000, NULL, NULL),
(6, 1, 'Study Plan', '1. Flask basics\n2. SQL joins\n3. Flask-Login', '#d69a9a', 0, 0, 1703000000, NULL, NULL),
(7, 1, 'Workout Routine', 'Pushups, Situps, Squats, Plank', '#92289a', 0, 0, 170400000, NULL, NULL),
(8, 1, 'Books to Read', 'Clean Code, Atomic Habits, Deep Work', '#00bfff', 0, 0, 1705000000, '', NULL),
(9, 1, 'Birthday Plans', 'Book a table, invite friends, get a cake', NULL, 0, 0, 1706000000, NULL, NULL),
(10, 1, 'Website Ideas', 'Note-taking app, To-do tracker, Budget planner', NULL, 0, 0, 1707000000, NULL, NULL),
(11, 1, 'Code Snippets', 'Remember how to hash passwords with bcrypt', NULL, 0, 0, 1708000000, '', NULL),
(12, 1, 'Quotes', '“Simplicity is the soul of efficiency.” – Austin Freeman', NULL, 0, 0, 1709000000, NULL, NULL),
(13, 1, 'Bug Log', 'Login page redirect fails when already logged in\r\nI\'ve just upload the file\r\nSecond attempted\r\nThird attempted', NULL, 0, 0, 1710000000, NULL, NULL),
(14, 1, 'John Corner', 'My name is John', NULL, 0, 0, 1711000000, NULL, NULL),
(15, 1, 'John', 'John Corner\r\n', NULL, 0, 0, 1712000000, NULL, NULL),
(19, 1, 'My Example Time 1:32', '', NULL, 0, 0, 1713000000, NULL, NULL),
(20, 1, 'Test at 2:20 24/4/2025', '', NULL, 0, 0, 1745454014, NULL, NULL),
(21, 1, 'Test at 12:24 25/4/2025', '', NULL, 0, 0, 1745533500, NULL, NULL),
(22, 1, 'Test at 2:07PM 26/4/2025', '', NULL, 0, 0, 1745651287, '', NULL),
(23, 1, 'Test at 2:37PM 26/4/2025', '', NULL, 0, 0, 1745653039, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shared_notes`
--

CREATE TABLE `shared_notes` (
  `id` int(11) NOT NULL,
  `note_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `permission` enum('view','edit') NOT NULL DEFAULT 'view',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `display_name`, `password`, `is_verified`, `verification_token`, `avatar`) VALUES
(1, 'kenshinhimura2173@gmail.com', 'kenshinhimura2173', '$2b$12$.fLrMZl.LWgyHw/50CG4R.qYLe5EgjbnelIpYJarvtdIVS8rSH586', 1, NULL, 'user_1_download.jpg'),
(6, 'leole030603@gmail.com', 'leole030603', '$2b$12$UKZB43NJc2Fzai5g8KU7BOb6r2CeFwf1RIpA3cqFLnt2rBwjj5jdG', 1, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `shared_notes`
--
ALTER TABLE `shared_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_sharing` (`note_id`,`recipient_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `shared_notes`
--
ALTER TABLE `shared_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shared_notes`
--
ALTER TABLE `shared_notes`
  ADD CONSTRAINT `shared_notes_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shared_notes_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shared_notes_ibfk_3` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
