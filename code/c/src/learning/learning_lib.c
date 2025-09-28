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
