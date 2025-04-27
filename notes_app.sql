-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 28, 2025 at 01:01 AM
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
  `lock_password_hash` text DEFAULT NULL,
  `created_at` bigint(20) UNSIGNED DEFAULT unix_timestamp(),
  `password_hash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notes`
--

INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `color`, `pinned`, `is_locked`, `lock_password_hash`, `created_at`, `password_hash`) VALUES
(2, 1, 'Second Note', 'More text for the second note.', '#16b192', 0, 0, NULL, 1700000000, NULL),
(4, 1, 'Meeting Notes', 'Discussed project timeline, assigned tasks.', '#d2cc19', 0, 0, NULL, 1701000000, NULL),
(5, 1, 'Shopping List', 'Eggs, Bread, Milk, Coffee', '#62c520', 0, 0, NULL, 1702000000, NULL),
(6, 1, 'Study Plan', '1. Flask basics\n2. SQL joins\n3. Flask-Login', '#d69a9a', 0, 0, NULL, 1703000000, NULL),
(7, 1, 'Workout Routine', 'Pushups, Situps, Squats, Plank', '#92289a', 0, 0, NULL, 170400000, NULL),
(8, 1, 'Books to Read', 'Clean Code, Atomic Habits, Deep Work', '#8593d5', 0, 0, NULL, 1705000000, ''),
(9, 1, 'Birthday Plans', 'Book a table, invite friends, get a cake', NULL, 0, 0, NULL, 1706000000, NULL),
(10, 1, 'Website Ideas', 'Note-taking app, To-do tracker, Budget planner', NULL, 0, 0, NULL, 1707000000, NULL),
(11, 1, 'Code Snippets', 'Remember how to hash passwords with bcrypt', NULL, 0, 0, NULL, 1708000000, NULL),
(12, 1, 'Quotes', '“Simplicity is the soul of efficiency.” – Austin Freeman', NULL, 0, 0, NULL, 1709000000, NULL),
(13, 1, 'Bug Log', 'Login page redirect fails when already logged in', NULL, 0, 1, NULL, 1710000000, '$2b$12$Uls7g5l2UpnWxrN2JzNoxeAmuGQoJZXy2b2E0Rhhg35UcW1lb8QvW'),
(14, 1, 'John Corner', 'My name is John', NULL, 0, 0, NULL, 1711000000, NULL),
(15, 1, 'John', 'John Corner\r\n', NULL, 0, 0, NULL, 1712000000, NULL),
(19, 1, 'My Example Time 1:32', '', NULL, 0, 0, NULL, 1713000000, NULL),
(20, 1, 'Test at 2:20 24/4/2025', '', NULL, 0, 0, NULL, 1745454014, NULL),
(21, 1, 'Test at 12:24 25/4/2025', '', NULL, 0, 0, NULL, 1745533500, NULL),
(22, 1, 'Test at 2:07PM 26/4/2025', '', NULL, 0, 1, NULL, 1745651287, '$2b$12$/Y5rD9yIe1mXg55GkmA2k.uKEKQf/hAMTi05QxJjn.BWBIl2p49Pu'),
(23, 1, 'Test at 2:37PM 26/4/2025', '', NULL, 0, 0, NULL, 1745653039, NULL);

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
  `verification_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `display_name`, `password`, `is_verified`, `verification_token`) VALUES
(1, 'kenshinhimura2173@gmail.com', 'kenshinhimura2173', '$2b$12$.fLrMZl.LWgyHw/50CG4R.qYLe5EgjbnelIpYJarvtdIVS8rSH586', 1, NULL),
(6, 'leole030603@gmail.com', 'leole030603', '$2b$12$UKZB43NJc2Fzai5g8KU7BOb6r2CeFwf1RIpA3cqFLnt2rBwjj5jdG', 1, NULL);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
