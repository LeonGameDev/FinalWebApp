-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 17, 2025 at 01:29 AM
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
  `color` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notes`
--

INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `color`) VALUES
(2, 1, 'Second Note', 'More text for the second note.', '#16b192'),
(4, 1, 'Meeting Notes', 'Discussed project timeline, assigned tasks.', '#d2cc19'),
(5, 1, 'Shopping List', 'Eggs, Bread, Milk, Coffee', '#62c520'),
(6, 1, 'Study Plan', '1. Flask basics\n2. SQL joins\n3. Flask-Login', NULL),
(7, 1, 'Workout Routine', 'Pushups, Situps, Squats, Plank', NULL),
(8, 1, 'Books to Read', 'Clean Code, Atomic Habits, Deep Work', NULL),
(9, 1, 'Birthday Plans', 'Book a table, invite friends, get a cake', NULL),
(10, 1, 'Website Ideas', 'Note-taking app, To-do tracker, Budget planner', NULL),
(11, 1, 'Code Snippets', 'Remember how to hash passwords with bcrypt', NULL),
(12, 1, 'Quotes', '“Simplicity is the soul of efficiency.” – Austin Freeman', NULL),
(13, 1, 'Bug Log', 'Login page redirect fails when already logged in', NULL),
(14, 1, 'John Corner', 'My name is John', NULL),
(15, 1, 'John', 'John Corner\r\n', NULL),
(16, 1, 'John Cena', 'My name is John Cena', NULL);

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
(4, 'leole030603@gmail.com', 'Leon', '$2b$12$3zfvBl5HoA9.pM7LAXRTI.2QNzB8ia/elKgJ8Ec1IKay87iYmTQuG', 1, '7cbc8286-c257-485e-999b-f2d40beb92d0');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
