import csv
import random
import sys
import argparse
from typing import List, Dict, Tuple, Union

# Global name data
WESTERN_FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
                     'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica']
WESTERN_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']

# Sources for contacts
SOURCES = ['Pitching', 'Referral', 'Website', 'Email', 'IG', 'LinkedIn', 'Facebook', 'Other']

# Simple remarks
REMARKS = [
    'Potential client',
    'Follow up needed',
    'Interested in services',
    'Meeting scheduled',
    'Call back requested',
    'Send information',
    'High priority',
    'New contact',
    'VIP client',
    'Waiting for response',
    'Check back next week',
    'Requires attention',
    'Good lead',
    'To be contacted',
    'Left message'
]

# Mainland Chinese names (simplified)
CN_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '林', '徐', '孙', '马', '胡']
CN_GIVEN_CHARS = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛']

# Hong Kong names (traditional + English)
HK_SURNAMES = [
    ('陳', 'Chan', 'Chan'),
    ('李', 'Lee', 'Lee'),
    ('黃', 'Wong', 'Wong'),
    ('張', 'Cheung', 'Cheung'),
    ('劉', 'Lau', 'Lau'),
    ('周', 'Chow', 'Chow'),
    ('吳', 'Ng', 'Ng'),
    ('葉', 'Yip', 'Yip'),
    ('林', 'Lam', 'Lam'),
    ('梁', 'Leung', 'Leung')
]

HK_GIVEN_NAMES = [
    ('家明', 'Ka Ming', 'Kevin'),
    ('志豪', 'Chi Ho', 'Howard'),
    ('詠詩', 'Wing Sze', 'Wincy'),
    ('美玲', 'Mei Ling', 'Mary'),
    ('嘉欣', 'Ka Yan', 'Karen'),
    ('俊傑', 'Chun Kit', 'Keith'),
    ('穎恩', 'Wing Yan', 'Vivian'),
    ('志強', 'Chi Keung', 'Chris'),
    ('美華', 'Mei Wah', 'May'),
    ('浩然', 'Ho Yin', 'Henry')
]

def generate_contacts(num_records: int, allow_duplicates: Union[bool, int] = False, output_file: str = "contacts.csv") -> List[Dict]:
    """
    Generate a CSV file with random contact information including names, emails, and phone numbers.
    
    Args:
        num_records: Number of records to generate
        allow_duplicates: If True, randomly include duplicates. If int, generate exactly that many duplicates
        output_file: Path to output CSV file
    """
    # Email domains
    email_domains = {
        'international': ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'],
        'china': ['qq.com', '163.com', '126.com'],
        'hk': ['yahoo.com.hk', 'netvigator.com', 'hku.hk']
    }
    
    def generate_single_contact() -> Dict:
        """Generate a single contact record"""
        name_type = random.choices(['western', 'chinese', 'hongkong'], weights=[0.3, 0.3, 0.4])[0]
        
        if name_type == 'western':
            first_name = random.choice(WESTERN_FIRST_NAMES)
            last_name = random.choice(WESTERN_LAST_NAMES)
            full_name = f"{first_name} {last_name}"
            email_name = f"{first_name.lower()}.{last_name.lower()}"
            email_domain = random.choice(email_domains['international'])
            country_code = random.choice(['+1', '+44', '+61', '+33', '+49'])
            
        elif name_type == 'chinese':
            surname = random.choice(CN_SURNAMES)
            given_name = random.choice(CN_GIVEN_CHARS)
            full_name = f"{surname}{given_name}"
            pinyin_mapping = {
                '王': 'wang', '李': 'li', '张': 'zhang', '刘': 'liu', '陈': 'chen',
                '杨': 'yang', '黄': 'huang', '赵': 'zhao', '吴': 'wu', '周': 'zhou'
            }
            email_name = f"{pinyin_mapping.get(surname, 'user')}{random.randint(100, 999)}"
            email_domain = random.choice(email_domains['china'])
            country_code = '+86'
            
        else:  # hongkong
            surname_tuple = random.choice(HK_SURNAMES)
            given_tuple = random.choice(HK_GIVEN_NAMES)
            full_name = f"{surname_tuple[0]}{given_tuple[0]}"  # Traditional Chinese
            roman_name = f"{surname_tuple[1]} {given_tuple[1]}"  # Romanized name
            english_name = f"{given_tuple[2]} {surname_tuple[2]}"  # English name
            
            # Randomly choose between different name formats for display
            full_name = random.choice([
                full_name,  # Traditional Chinese only
                f"{full_name} ({roman_name})",  # Traditional + romanized
                f"{full_name} ({english_name})"  # Traditional + English
            ])
            
            email_name = f"{given_tuple[2].lower()}.{surname_tuple[2].lower()}"
            email_domain = random.choice(email_domains['hk'] + email_domains['international'])
            country_code = '+852'
        
        # Generate email
        email = f"{email_name}@{email_domain}"
        
        # Generate phone number based on country code
        if country_code == '+86':  # China format
            phone = f"{country_code} {random.randint(130, 199)}{random.randint(10000000, 99999999)}"
        elif country_code == '+852':  # Hong Kong format
            phone = f"{country_code} {random.choice([2,3,5,6,9])}{random.randint(1000000, 9999999)}"
        elif country_code == '+1':  # US format
            phone = f"{country_code} {random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
        else:  # International format
            phone = f"{country_code} {random.randint(100000000, 999999999)}"
        
        # Generate source and remark
        source = random.choice(SOURCES)
        remark = random.choice(REMARKS)
        
        return {
            'name': full_name,
            'email': email,
            'phone': phone,
            'source': source,
            'remark': remark
        }
    
    contacts = []
    
    if allow_duplicates:
        base_contacts = [generate_single_contact() for _ in range(max(3, num_records // 3))]
        contacts = []
        
        if isinstance(allow_duplicates, int):
            # Generate exact number of duplicates
            num_duplicates = min(allow_duplicates, num_records)
            num_unique = num_records - num_duplicates
            
            # Generate unique contacts
            for _ in range(num_unique):
                contacts.append(generate_single_contact())
                
            # Add exact number of duplicates
            for _ in range(num_duplicates):
                contacts.append(random.choice(contacts).copy())
        else:
            # Original behavior - random 30% chance of duplicates
            for _ in range(num_records):
                if random.random() < 0.3:  # 30% chance of duplicate
                    contacts.append(random.choice(base_contacts).copy())
                else:
                    contacts.append(generate_single_contact())
    else:
        contacts = [generate_single_contact() for _ in range(num_records)]
    
    # Write to CSV file
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['name', 'email', 'phone', 'source', 'remark']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(contacts)
    
    return contacts

def count_name_types(contacts: List[Dict]) -> Tuple[int, int, int]:
    """Count the number of each type of name in the contacts list"""
    num_hk = sum(
        '(' in c['name']
        or any(surname[0] in c['name'] for surname in HK_SURNAMES)
        for c in contacts
    )
    num_cn = (
        sum(any((char in c['name'] for char in CN_SURNAMES)) for c in contacts)
        - num_hk
    )
    num_western = len(contacts) - num_hk - num_cn
    return num_western, num_cn, num_hk

def main():
    parser = argparse.ArgumentParser(description='Generate random contact information')
    parser.add_argument('num_records', type=int, help='Number of records to generate')
    parser.add_argument('--duplicate', nargs='?', const=True, type=int, metavar='N',
                      help='Allow duplicate records. If N is specified, exactly N duplicates will be generated')
    
    args = parser.parse_args()
    
    if args.num_records <= 0:
        print("Error: Number of records must be positive")
        sys.exit(1)
    
    # Generate contacts
    generated_contacts = generate_contacts(args.num_records, args.duplicate)
    
    # Count types of names and duplicates for reporting
    unique_contacts = {(c['name'], c['email'], c['phone']) for c in generated_contacts}
    num_duplicates = len(generated_contacts) - len(unique_contacts)
    num_western, num_cn, num_hk = count_name_types(generated_contacts)
    
    print(f"Successfully generated {args.num_records} contacts and saved to 'contacts.csv'")
    print(f"Distribution:")
    print(f"- Western names: {num_western}")
    print(f"- Mainland Chinese names: {num_cn}")
    print(f"- Hong Kong names: {num_hk}")
    if args.duplicate:
        print(f"Included {num_duplicates} duplicate records")

if __name__ == "__main__":
    main()