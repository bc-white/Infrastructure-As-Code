#include "learning.h"
#include <stdio.h>

// Main function (entry point)
int main(int argc, char **argv) {
  const char *message = get_greeting_message();
  printf("%s\n", message);

  if (argc > 1) {
    char personalized[100];
    if (format_greeting(personalized, sizeof(personalized), argv[1]) == 0) {
      printf("%s\n", personalized);
    }
  }

  return 0;
}
