cmake_minimum_required(VERSION 3.10.0)

# Enable export of compile commands for SonarQube integration
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Set C standard
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Coverage option
option(ENABLE_COVERAGE "Enable coverage reporting" ON)

# Setup Learning Project
project(learning VERSION 0.1.0 LANGUAGES C CXX)

# Configure coverage after project() call so compiler is detected
if(ENABLE_COVERAGE)
    # Add coverage flags for GCC/Clang/AppleClang
    if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang|AppleClang")
        message(STATUS "Coverage enabled with ${CMAKE_C_COMPILER_ID}")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} --coverage -g -O0")
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
    else()
        message(WARNING "Coverage only supported with GCC, Clang, or AppleClang (found: '${CMAKE_C_COMPILER_ID}')")
    endif()
endif()

# Create library for shared code (so tests can link to it)
add_library(learning_lib STATIC src/learning/learning_lib.c)
target_include_directories(learning_lib PUBLIC src/learning)

# Main executable
add_executable(learning src/learning/learning.c)
target_link_libraries(learning learning_lib)
set_target_properties(learning PROPERTIES OUTPUT_NAME "learning.exe")
set_target_properties(learning PROPERTIES OUTPUT_NAME "learning.exe")
enable_testing()
add_executable(test_learning src/learning/tests/test_learning.c)
target_link_libraries(test_learning learning_lib)

# Register test with CTest
add_test(NAME LearningTests COMMAND test_learning)

# Add a test that runs the main executable to get coverage on main()
add_test(NAME MainExecutableTest COMMAND learning.exe)
add_test(NAME MainExecutableWithArgsTest COMMAND learning.exe TestUser)

# Coverage targets (only available when coverage is enabled)
if(ENABLE_COVERAGE)
    # Find required tools
    find_program(LCOV_PATH lcov)
    find_program(GENHTML_PATH genhtml)

    if(LCOV_PATH AND GENHTML_PATH)
        message(STATUS "lcov and genhtml found, coverage targets available")

        # Setup coverage target
        add_custom_target(coverage
            COMMENT "Generating code coverage report"
            COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/coverage

            # Reset coverage counters
            COMMAND ${LCOV_PATH} --directory . --zerocounters

            # Run tests
            COMMAND ${CMAKE_CTEST_COMMAND} --verbose

            # Capture coverage data
            COMMAND ${LCOV_PATH} --directory . --capture --output-file coverage.info

            # Remove unwanted files (system headers, test files)
            COMMAND ${LCOV_PATH} --remove coverage.info '*/tests/*' --output-file coverage.info --ignore-errors unused

            # Generate HTML report
            COMMAND ${GENHTML_PATH} coverage.info --output-directory coverage

            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        )

        # Add a simple gcov target for SonarQube (generates .gcov files)
        add_custom_target(coverage-gcov
            COMMENT "Generating gcov files for SonarQube"
            COMMAND ${CMAKE_CTEST_COMMAND} --verbose
            COMMAND find . -name "*.gcno" -exec gcov {} +
            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        )

    else()
        message(WARNING "lcov and/or genhtml not found, coverage targets not available")
    endif()
endif()
