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
from nltk.corpus import stopwords
from scripts.python import skill_compression

# Set up logging
logging.basicConfig(format="{asctime} - {levelname} - {message}",
                    style="{",
                    datefmt="%Y-%m-%d %H:%M:%S",
                    handlers=[logging.StreamHandler(sys.stdout)],
                    level=logging.INFO)

STOPWORDS = set(stopwords.words('english'))

@pytest.fixture()
def generate_stopword() -> List[tuple]:
    '''Set up strings with a test words with stop words.'''
    logging.info("Setting up skill with stop words....")
    return [('Python and Java', 'Python Java'),
            ('Python','Python')]

@pytest.fixture()
def generate_branded_skill() -> List[tuple]:
    '''Set up a strings with a branded skill.'''
    logging.info("Setting up branded skill....")
    return [('Microsoft Windows Server', 'Windows Server'),
            ('Microsoft Windows', 'Windows'),
            ('MS Windows', 'Windows'),
            ('MS Windows Server', 'Windows Server'),
            ('Python', 'Python')]

def test_coalesce_brands(generate_branded_skill) -> None:
    '''Test the coalesce_brands function.

    This test checks that the branded skills are removed from the provided skill.

    Args:
        generate_branded_skill (List[tuple]): A list of tuples containing the test data and expected outcome.
    '''
    logging.info("Testing coalesce_brands...")
    for skill in generate_branded_skill:
        assert skill_compression.coalesce_brands(skill[0]) == skill[1]

def test_remove_stopwords(generate_stopword) -> None:
    '''Test the remove_stopwords function.

    This test checks that the stop word is removed from the provided skill.

    Args:
        generate_stopword (List[tuple]):  list of tuples containing the test data and expected outcome.
    '''
    logging.info("Testing remove_stopwords...")
    for skill in generate_stopword:
        assert skill_compression.remove_stopwords(skill[0]) == skill[1]

if __name__ == "__main__":
    pytest.main()
