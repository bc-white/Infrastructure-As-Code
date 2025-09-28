cmake_minimum_required(VERSION 3.10.0)

# Enable export of compile commands for SonarQube integration
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Set C standard
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Setup Learning Project
project(learning VERSION 0.1.0 LANGUAGES C CXX)

# Create library for shared code (so tests can link to it)
add_library(learning_lib STATIC src/learning/learning_lib.c)
target_include_directories(learning_lib PUBLIC src/learning)
add_executable(learning src/learning/learning.c)
target_link_libraries(learning learning_lib)
set_target_properties(learning PROPERTIES OUTPUT_NAME "learning.exe")
enable_testing()
add_executable(test_learning src/learning/tests/test_learning.c)
target_link_libraries(test_learning learning_lib)

# Register test with CTest
add_test(NAME LearningTests COMMAND test_learning)
