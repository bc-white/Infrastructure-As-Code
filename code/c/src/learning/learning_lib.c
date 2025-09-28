#include "learning.h"
#include <stdio.h>
#include <string.h>

const char *get_greeting_message(void) { return "Hello, from learning!"; }

int format_greeting(char *buffer, size_t buffer_size, const char *name) {
  if (buffer == NULL || name == NULL || buffer_size == 0) {
    return -1;
  }

  int result = snprintf(buffer, buffer_size, "Hello, %s!", name);
  return (result > 0 && (size_t)result < buffer_size) ? 0 : -1;
}

// Application logic (testable function)
int run_learning_app(int argc, char **argv) {
  const char *message = get_greeting_message();
  printf("%s\n", message);

  if (argc > 1) {
    char personalized[50]; // Reduced buffer size to trigger overflow test
    if (format_greeting(personalized, sizeof(personalized), argv[1]) == 0) {
      printf("%s\n", personalized);
      return 0; // Success with personalized message
    } else {
      return 1; // Error formatting message
    }
  }

  return 0; // Success with default message
}
