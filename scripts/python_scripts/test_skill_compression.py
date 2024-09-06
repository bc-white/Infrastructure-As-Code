'''
This script tests the skill_compression.py script.

Ensure you have installed the NLTK and fuzzywuzzy library as well as pytest:
    pip install nltk
    pip install fuzzywuzzy
    pip install pytest
'''

import logging
import sys
from typing import List
import pytest
import skill_compression
from nltk.corpus import stopwords

# Set up logging
logging.basicConfig(format="{asctime} - {levelname} - {message}",
                    style="{",
                    datefmt="%Y-%m-%d %H:%M:%S",
                    handlers=[logging.StreamHandler(sys.stdout)],
                    level=logging.INFO)

STOPWORDS = set(stopwords.words('english'))

@pytest.fixture()
def generate_test_list() -> List[str]:
    '''Set up the required test data.'''
    logging.info("Setting up test data...")
    return ['Python','Windows Server 2012 R2','Windows 11', 'MS Windows 10', 'Python and Java']

@pytest.fixture()
def generate_stopword() -> tuple:
    '''Set up a string with a test word with a stop word.'''
    logging.info("Setting up skill with stop word....")
    return 'Python and Java', 'Python Java'

@pytest.fixture()
def generate_non_stopword() -> str:
    '''Set up a string with a test word without a stop word.'''
    logging.info("Setting up skill without stop word....")
    return 'Python'

def test_removal_of_stop_words(generate_stopword) -> None:
    '''Test the remove_stopwords function.

    This test checks that the stop word is removed from the provided skill.

    Args:
        generate_stopword (tuple): A tuple containing the test data and expected outcome.
    '''
    logging.info("Testing remove_stopwords with skill containing stop word...")
    skill = skill_compression.remove_stopwords(generate_stopword[0], STOPWORDS)
    assert skill == generate_stopword[1]

def test_removal_of_stop_words_(generate_non_stopword) -> None:
    '''Test the remove_stopwords function.

    This test checks that the stop word is removed from the provided skill.

    Args:
        generate_stopword (str): A string containing the test data.
    '''
    logging.info("Testing remove_stopwords without skill containing stop word...")
    skill = skill_compression.remove_stopwords(generate_non_stopword, STOPWORDS)
    assert skill == generate_non_stopword

if __name__ == "__main__":
    pytest.main()
