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
def generate_wordnet_pos() -> List[tuple]:
    '''Set up strings with a test word and the expected part of speech.'''
    logging.info("Setting up wordnet pos....")
    return [('Python', 'N'),
            ('Java', 'N'),
            ('Administered', 'V'),
            ('Expertly', 'R'),
            ('Massive', 'A')]

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
    return [('microsoft windows server', 'Windows Server'),
            ('microsoft windows', 'Windows'),
            ('ms windows', 'Windows'),
            ('ms windows server', 'Windows Server'),
            ('python', 'python')]

def test_coalesce_brands(generate_branded_skill) -> None:
    '''Test the coalesce_brands function.

    This test checks that the branded skills are removed from the provided skill.

    Args:
        generate_branded_skill (List[tuple]): A list of tuples containing the test
                                              data and expected outcome.
    '''
    logging.info("Testing coalesce_brands...")
    for skill in generate_branded_skill:
        print("Input: " + skill[0])
        print("Expected result: " + skill[1])
        print(skill_compression.coalesce_brands(skill[0]))
        assert skill_compression.coalesce_brands(skill[0]) == skill[1]

def test_remove_stopwords(generate_stopword) -> None:
    '''Test the remove_stopwords function.

    This test checks that the stop word is removed from the provided skill.

    Args:
        generate_stopword (List[tuple]):  list of tuples containing the test data
                                          and expected outcome.
    '''
    logging.info("Testing remove_stopwords...")
    for skill in generate_stopword:
        assert skill_compression.remove_stopwords(skill[0], STOPWORDS) == skill[1]

def test_get_wordnet_pos(generate_wordnet_pos) -> None:
    '''Test the get_wordnet_pos function.

    This test checks that the part of speech is correctly identified.

    Args:
        generate_wordnet_pos (List[tuple]): list of tuples containing the test data
                                            and expected outcome.
    '''
    logging.info("Testing get_wordnet_pos...")
    for skill in generate_wordnet_pos:
        assert skill_compression.get_wordnet_pos(skill[0]) == skill[1]

if __name__ == "__main__":
    pytest.main()
