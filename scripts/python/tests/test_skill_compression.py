'''
This script tests the skill_compression.py script.

Ensure you have installed the NLTK and fuzzywuzzy library as well as pytest:
    pip install nltk
    pip install fuzzywuzzy
    pip install pytest
'''

import logging
import re
import sys
from typing import List
import pytest
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from scripts.python import skill_compression

# Set up logging
logging.basicConfig(format="{asctime} - {levelname} - {message}",
                    style="{",
                    datefmt="%Y-%m-%d %H:%M:%S",
                    handlers=[logging.StreamHandler(sys.stdout)],
                    level=logging.INFO)

STOPWORDS = set(stopwords.words('english'))
CONTENT = '''Python
             Java
             Microsoft Windows Server'''

@pytest.fixture()
def generate_test_file(tmp_path) -> tuple:
    '''Set up a test file with strings..'''
    logging.info("Setting up test file....")
    temp_dir = tmp_path / "ingest"
    temp_dir.mkdir()
    temp_file = temp_dir / "test.txt"
    temp_file.write_text(CONTENT)
    return (temp_file,['python','java','Windows Server'])

@pytest.fixture()
def generate_wordnet_pos() -> List[tuple]:
    '''Set up strings with a test word and the expected part of speech.'''
    logging.info("Setting up wordnet pos....")
    return [('Python', 'n'),
            ('Java', 'n'),
            ('Administered', 'v'),
            ('Expertly', 'r'),
            ('Massive', 'a')]

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

@pytest.fixture()
def generate_normalize_skill() -> List[tuple]:
    '''Set up a strings with a skill to normalize.'''
    logging.info("Setting up skill to normalize....")
    return [('Python', 'python'),
            ('Windows Server', 'window server'),
            ('Expertly solved problems', 'expertly solve problem'),]

@pytest.fixture()
def generate_duplicate_skill() -> List[tuple]:
    '''Set up a strings with a duplicate skill.'''
    logging.info("Setting up duplicate skill....")
    return [(['Python','Python','Java'],['Python','Java'])]

@pytest.fixture()
def generate_condense_skills() -> List[tuple]:
    '''Set up a strings with a duplicate skill.'''
    logging.info("Setting up condense skills....")
    return [(['Python', 'Java', 'C++'], ['Python', 'Java', 'C++'],[]),
            (['Python', 'Java', 'Python coding'], ['Python', 'Java','Python coding'],[]),
            (['Java','Javascript','Javascripting'], ['Java','Javascript'], ['Javascripting']),
            (['Microsoft Windows Server','Microsoft Windows Server 2003 R2'], ['Microsoft Windows Server'], ['Microsoft Windows Server 2003 R2'])]

def test_coalesce_brands(generate_branded_skill) -> None:
    '''Test the coalesce_brands function.

    This test checks that the branded skills are removed from the provided skill.

    Args:
        generate_branded_skill (List[tuple]): A list of tuples containing the test
                                              data and expected outcome.
    '''
    logging.info("Testing coalesce_brands...")
    for skill in generate_branded_skill:
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

def test_normalize_skill(generate_normalize_skill) -> None:
    '''Test the normalize_skill function.

    This test checks that the skill is normalized correctly.

    Args:
        generate_normalize_skill (List[tuple]): list of tuples containing the test
                                                data and expected outcome.
    '''
    logging.info("Testing normalize_skill...")
    lemmatizer = WordNetLemmatizer()
    for skill in generate_normalize_skill:
        assert skill_compression.normalize_skill(skill[0],lemmatizer) == skill[1]

def test_deduplicate_skills(generate_duplicate_skill) -> None:
    '''Test the deduplicate_skills function.

    This test checks that duplicate skills are removed from the provided list.

    Args:
        generate_duplicate_skill (List[tuple]): list of tuples containing the test
                                                data and expected outcome.
    '''
    logging.info("Testing deduplicate_skills...")
    for skill in generate_duplicate_skill:
        assert skill_compression.deduplicate_skills(skill[0]) == skill[1]

def test_condense_skills(generate_condense_skills) -> None:
    '''Test the condense_skills function.

    This test checks that similar skills are condensed into a single skill.

    Args:
        generate_condense_skills (List[tuple]): list of tuples containing the test
                                                data and expected outcome.
    '''
    logging.info("Testing condense_skills...")
    for skill in generate_condense_skills:
        condensed_skills, removed_skills = skill_compression.condense_skills(skill[0], 80)
        print(condensed_skills, removed_skills)
        assert condensed_skills == skill[1]
        assert removed_skills == skill[2]

def test_ingest_skills(generate_test_file):
    '''Test the ingest_skills function.

    This test checks that the skills are ingested correctly.

    Args:
        generate_test_file (str): The test file to ingest.
    '''
    logging.info("Testing ingest_skills...")
    assert skill_compression.ingest_skills(generate_test_file[0],STOPWORDS) == generate_test_file[1]

if __name__ == "__main__":
    pytest.main()
