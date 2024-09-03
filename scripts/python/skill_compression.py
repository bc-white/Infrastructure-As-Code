'''
This script accepts a list of skills as input and emits a list
of condensed root skills (e.g., 'java' instead of 'java programming').

Ensure you have installed the NLTK library:
    pip install nltk

Usage: python skill_condenser.py < src_skills.txt > < dest_skills.txt >
'''
import argparse
import logging
import sys
from typing import List
from nltk import download as nltk_download
from nltk.corpus import stopwords
# from nltk.tokenize import word_tokenize

# Set up logging
logging.basicConfig(format="{asctime} - {levelname} - {message}",
                    style="{",
                    datefmt="%Y-%m-%d %H:%M:%S",
                    handlers=[logging.StreamHandler(sys.stdout)],
                    level=logging.INFO)

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

def ingest_skills(skills_file: str) -> List[str]:
    """Ingest skills from a file, splitting sentences on commas and semicolons
    Args:
        skills_file (str): Path to the skills file
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
                for skill in line.strip().replace(';', ',').split(','):
                    skills.append(skill.strip())
        return skills
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

def main(args: argparse.Namespace) -> None:
    """Main function
    Args:
        args (argparse.Namespace): Command-line arguments
    """
    logging.info('Downloading NLTK stopwords...')
    nltk_download('stopwords', quiet=True)
    stop_words = set(stopwords.words('english'))
    try:
        skills = ingest_skills(args.src_skill_file)
    except FileNotFoundError as exc:
        logging.error(exc)
        sys.exit(1)
    try:
        output_skills(skills, args.dest_skill_file)
    except PermissionError as exc:
        logging.error(exc)
        sys.exit(1)
    # print(stop_words)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        logging.error('Usage: python skill_condenser.py < src_skills.txt > < dest_skills.txt >')
        sys.exit(1)
    else:
        cli_args = process_args()
        main(cli_args)
