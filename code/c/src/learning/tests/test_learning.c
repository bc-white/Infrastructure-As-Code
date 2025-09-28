#include "learning.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

// Simple test framework macros
#define TEST_ASSERT(condition, message)                                        \
  do {                                                                         \
    if (!(condition)) {                                                        \
      printf("FAIL: %s\n", message);                                           \
      return 1;                                                                \
    } else {                                                                   \
      printf("PASS: %s\n", message);                                           \
    }                                                                          \
  } while (0)

#define TEST_ASSERT_EQUAL_STRING(expected, actual, message)                    \
  do {                                                                         \
    if (strcmp(expected, actual) != 0) {                                       \
      printf("FAIL: %s - Expected: '%s', Got: '%s'\n", message, expected,      \
             actual);                                                          \
      return 1;                                                                \
    } else {                                                                   \
      printf("PASS: %s\n", message);                                           \
    }                                                                          \
  } while (0)

int test_get_greeting_message() {
  printf("\n=== Testing get_greeting_message ===\n");

  const char *message = get_greeting_message();

  TEST_ASSERT(message != NULL, "get_greeting_message should not return NULL");
  TEST_ASSERT_EQUAL_STRING(
      "Hello, from learning!", message,
      "get_greeting_message should return correct message");

  return 0;
}

int test_format_greeting() {
  printf("\n=== Testing format_greeting ===\n");

  char buffer[100];
  int result;

  // Test normal case
  result = format_greeting(buffer, sizeof(buffer), "World");
  TEST_ASSERT(result == 0,
              "format_greeting should succeed with valid parameters");
  TEST_ASSERT_EQUAL_STRING("Hello, World!", buffer,
                           "format_greeting should format correctly");

  // Test with different name
  result = format_greeting(buffer, sizeof(buffer), "CMake");
  TEST_ASSERT(result == 0,
              "format_greeting should succeed with different name");
  TEST_ASSERT_EQUAL_STRING(
      "Hello, CMake!", buffer,
      "format_greeting should format different names correctly");

  // Test error cases
  result = format_greeting(NULL, sizeof(buffer), "Test");
  TEST_ASSERT(result == -1, "format_greeting should fail with NULL buffer");

  result = format_greeting(buffer, sizeof(buffer), NULL);
  TEST_ASSERT(result == -1, "format_greeting should fail with NULL name");

  result = format_greeting(buffer, 0, "Test");
  TEST_ASSERT(result == -1,
              "format_greeting should fail with zero buffer size");

  // Test buffer too small
  char small_buffer[5];
  result = format_greeting(small_buffer, sizeof(small_buffer), "VeryLongName");
  TEST_ASSERT(result == -1,
              "format_greeting should fail when buffer is too small");

  return 0;
}

int test_run_learning_app() {
  printf("\n=== Testing run_learning_app ===\n");

  // Test with no arguments
  char *argv1[] = {"program"};
  int result1 = run_learning_app(1, argv1);
  TEST_ASSERT(result1 == 0,
              "run_learning_app should succeed with no arguments");

  // Test with valid argument
  char *argv2[] = {"program", "World"};
  int result2 = run_learning_app(2, argv2);
  TEST_ASSERT(result2 == 0,
              "run_learning_app should succeed with valid argument");

  // Test with very long argument (should cause formatting error)
  char *argv3[] = {"program", "VeryLongNameThatWillCauseBufferOverflowInFormatt"
                              "ingFunctionBecauseItIsWayTooLong"};
  int result3 = run_learning_app(2, argv3);
  TEST_ASSERT(
      result3 == 1,
      "run_learning_app should fail with argument that causes buffer overflow");

  return 0;
}

int main(void) {
  printf("Running Learning Tests...\n");

  int failures = 0;

  failures += test_get_greeting_message();
  failures += test_format_greeting();
  failures += test_run_learning_app();

  printf("\n=== Test Summary ===\n");
  if (failures == 0) {
    printf("All tests passed!\n");
    return 0;
  } else {
    printf("%d test(s) failed!\n", failures);
    return 1;
  }
}
