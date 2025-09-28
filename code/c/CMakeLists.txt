cmake_minimum_required(VERSION 3.10.0)

# Enable export of compile commands for SonarQube integration
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Set C standard
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Setup Learning Project
project(learning VERSION 0.1.0 LANGUAGES C CXX)
add_executable(learning src/learning/learning.c)
set_target_properties(learning PROPERTIES OUTPUT_NAME "learning.exe")
