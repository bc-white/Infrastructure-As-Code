#ifndef LEARNING_H
#define LEARNING_H

#include <stddef.h>

const char *get_greeting_message(void);
int format_greeting(char *buffer, size_t buffer_size, const char *name);

#endif
