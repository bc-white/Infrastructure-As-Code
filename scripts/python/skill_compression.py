'''
This script accepts a list of skills as input and emits a list
of condensed root skills (e.g., 'java' instead of 'java programming').

Ensure you have installed the NLTK library:
    pip install nltk

Usage: python skill_condenser.py < src_skills.txt > < dest_skills.txt >
'''
import argparse
import logging
import os
import re
import sys
from typing import List, Set
from venv import logger
from fuzzywuzzy import process, fuzz
from nltk import download as nltk_download
from nltk.corpus import stopwords, wordnet
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag

# Set up logging
logging.basicConfig(format="{asctime} - {levelname} - {message}",
                    style="{",
                    datefmt="%Y-%m-%d %H:%M:%S",
                    handlers=[logging.StreamHandler(sys.stdout)],
                    level=logging.INFO)

# Download NLTK resources
logging.info('Downloading NLTK resources...')
nltk_download('stopwords', quiet=True)
nltk_download('punkt_tab', quiet=True)
nltk_download('wordnet', quiet=True)
nltk_download('omw-1.4', quiet=True)
nltk_download('averaged_perceptron_tagger_eng', quiet=True)

def process_args() -> argparse.Namespace:
    """Process command-line arguments
    Returns:
        argparse.Namespace: Arguments
    """
    parser = argparse.ArgumentParser(
        prog='skill_compression',
        description='Condenses a list of skills to root skills.')
    parser.add_argument('src_skill_file',
                        type=str,
                        help='Path to the source skills file')
    parser.add_argument('dest_skill_file',
                        type=str,
                        help='Path to the destination condensed skills file')
    return parser.parse_args()

def sanitize_args(args: argparse.Namespace) -> argparse.Namespace:
    """Sanitize command-line arguments
    Args:
        args (argparse.Namespace): Command-line arguments
    Returns:
        argparse.Namespace: Sanitized arguments
    """
    logging.info('Sanitizing arguments...')
    args.src_skill_file = os.path.realpath(args.src_skill_file)
    args.dest_skill_file = os.path.realpath(args.dest_skill_file)
    return args

def ingest_skills(skills_file: str, stop_words: Set[str]) -> List[str]:
    """Ingest skills from a file, splitting sentences on commas and semicolons
    Args:
        skills_file (str): Path to the skills file
        stop_words (Set[str]): List of stopwords to remove
    Returns:
        List[str]: List of skills
    
    Raises:
        FileNotFoundError: If the skills file is not found
    """
    logging.info('Ingesting skills from %s...', skills_file)
    skills = []
    try:
        with open(skills_file, 'r', encoding='utf-8') as src_skills:
            for line in src_skills:
                # Split on commas, but not within parentheses
                for skill in re.split(r',\s*(?![^()]*\))',line.strip().replace(';', ',')):
                    skills.append(remove_stopwords(skill.strip(), stop_words))
        return deduplicate_skills(skills)
    except FileNotFoundError as exc:
        raise FileNotFoundError(f'Skills file: {skills_file} not found') from exc

def output_skills(skills: List[str], dest_skills_file: str) -> None:
    """Output skills to a file
    Args:
        skills (List[str]): List of skills
        dest_skills_file (str): Path to the destination skills file
    """
    logging.info('Outputting skills to %s...', dest_skills_file)
    try:
        with open(dest_skills_file, 'w', encoding='utf-8') as dest_skills:
            for skill in skills:
                dest_skills.write(f'{skill}\n')
    except PermissionError as exc:
        raise PermissionError(f'Permission denied writing: {dest_skills_file}') from exc

def remove_stopwords(skill: str, stop_words: set) -> str:
    """Remove stopwords from a skill
    Args:
        skill (str): Skill to remove stopwords from
        stop_words (set): Set of stopwords
    Returns:
        str: Skill with stopwords removed
    """
    skill_tokens = word_tokenize(skill)
    filtered_skill = [word for word in skill_tokens if word.lower() not in stop_words]
    return ' '.join(filtered_skill)

def deduplicate_skills(skills: List[str]) -> List[str]:
    """Deduplicate skills
    Args:
        skills (List[str]): List of skills
    Returns:
        List[str]: List of unique skills
    """
    logging.info('Deduplicating skills...')
    return list({k: None for k in skills}.keys())

def condense_skill(skill_list: List[str], threshold: int = 80) -> List[str]:
    """Condense a skill through deduplication using fuzzy matching
    Args:
        skill_list (List[str]): List of skills
        threshold (int): Fuzzy matching threshold
    Returns:
        List[str]: List of condensed skills
    """
    logging.info('Condensing skills...')
    condensed_skills = []
    for skill in skill_list:
        match = process.extractOne(skill, condensed_skills, scorer=fuzz.ratio)
        if match <= threshold:
            condensed_skills.append(skill)
    return deduplicate_skills(condensed_skills)

def get_wordnet_pos(word) -> str:
    """Map POS tag to first character of WordNet POS tag
    Args:
        word (str): Word to get POS tag for
    Returns:
        str: First character of WordNet POS tag
    """
    tag = pos_tag([word])[0][1][0].upper()
    tag_dict = {
        'J': wordnet.ADJ,
        'N': wordnet.NOUN,
        'V': wordnet.VERB,
        'R': wordnet.ADV
    }
    return tag_dict.get(tag, wordnet.NOUN)

def normalize_skill(skill: str, lemmatizer: WordNetLemmatizer) -> str:
    """Normalize a skill by stemming and removing stopwords
    Args:
        skill (str): Skill to normalize
    Returns:
        str: Normalized skill
    """
    tokens = skill.lower().split()
    lemmatized_tokens = [lemmatizer.lemmatize(token, get_wordnet_pos(token)) for token in tokens]
    return ' '.join(lemmatized_tokens)

def main(args: argparse.Namespace) -> None:
    """Main function
    Args:
        args (argparse.Namespace): Command-line arguments
    """
    args = sanitize_args(args)
    stop_words = set(stopwords.words('english'))
    try:
        skills = ingest_skills(args.src_skill_file, stop_words)
    except FileNotFoundError as exc:
        logging.error(exc)
        sys.exit(1)
    lemmatizer = WordNetLemmatizer()
    logger.info('Normalizing skills...')
    normalized_skills = [normalize_skill(skill,lemmatizer) for skill in skills]
    condensed_skills_list = condense_skill(normalized_skills)
    try:
        output_skills(condensed_skills_list, args.dest_skill_file)
    except PermissionError as exc:
        logging.error(exc)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        logging.error('Usage: python skill_condenser.py < src_skills.txt > < dest_skills.txt >')
        sys.exit(1)
    else:
        cli_args = process_args()
        main(cli_args)
