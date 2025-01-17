import csv
import random
import sys
import argparse
from typing import List, Dict, Tuple

def generate_contacts(num_records: int, allow_duplicates: bool = False, output_file: str = "contacts.csv") -> List[Dict]:
    """
    Generate a CSV file with random contact information including names, emails, and phone numbers.
    """
    # Western names
    western_first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
                         'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica']
    western_last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
    
    # Mainland Chinese names (simplified)
    cn_surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '林', '徐', '孙', '马', '胡']
    cn_given_chars = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛']
    
    # Hong Kong names (traditional + English)
    # Format: (traditional, canton_surname_roman, common_english_name)
    hk_surnames = [
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
    
    # Hong Kong given names (traditional, canton_roman, english_name)
    hk_given_names = [
        ('家明', 'Ka Ming', 'Kevin'),
        ('志豪', 'Chi Ho', 'Howard'),
        ('詠詩', 'Wing Sze', 'Wincy'),
        ('美玲', 'Mei Ling', 'Mary'),
        ('嘉欣', 'Ka Yan', 'Karen'),
        ('俊傑', 'Chun Kit', 'Keith'),
        ('穎恩', 'Wing Yan', 'Vivian'),
        ('志強', 'Chi Keung', 'Chris'),
        ('美華', 'Mei Wah', 'May'),
        ('浩然', 'Ho Yin', 'Henry'),
        ('詠怡', 'Wing Yee', 'Winnie'),
        ('建華', 'Kin Wah', 'Kenny'),
        ('慧珊', 'Wai Shan', 'Wilson'),
        ('婉婷', 'Yuen Ting', 'Tina'),
        ('志明', 'Chi Ming', 'Jimmy')
    ]
    
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
            first_name = random.choice(western_first_names)
            last_name = random.choice(western_last_names)
            full_name = f"{first_name} {last_name}"
            email_name = f"{first_name.lower()}.{last_name.lower()}"
            email_domain = random.choice(email_domains['international'])
            country_code = random.choice(['+1', '+44', '+61', '+33', '+49'])
            
        elif name_type == 'chinese':
            surname = random.choice(cn_surnames)
            given_name = random.choice(cn_given_chars)
            full_name = f"{surname}{given_name}"
            pinyin_mapping = {
                '王': 'wang', '李': 'li', '张': 'zhang', '刘': 'liu', '陈': 'chen',
                '杨': 'yang', '黄': 'huang', '赵': 'zhao', '吴': 'wu', '周': 'zhou'
            }
            email_name = f"{pinyin_mapping.get(surname, 'user')}{random.randint(100, 999)}"
            email_domain = random.choice(email_domains['china'])
            country_code = '+86'
            
        else:  # hongkong
            surname_tuple = random.choice(hk_surnames)
            given_tuple = random.choice(hk_given_names)
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
        
        return {
            'name': full_name,
            'email': email,
            'phone': phone
        }
    
    contacts = []
    
    if allow_duplicates:
        base_contacts = [generate_single_contact() for _ in range(max(3, num_records // 3))]
        contacts = []
        for _ in range(num_records):
            if random.random() < 0.3:  # 30% chance of duplicate
                contacts.append(random.choice(base_contacts).copy())
            else:
                contacts.append(generate_single_contact())
    else:
        contacts = [generate_single_contact() for _ in range(num_records)]
    
    # Write to CSV file
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['name', 'email', 'phone']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(contacts)
    
    return contacts

def main():
    parser = argparse.ArgumentParser(description='Generate random contact information')
    parser.add_argument('num_records', type=int, help='Number of records to generate')
    parser.add_argument('--duplicate', action='store_true', 
                      help='Allow duplicate records in the output')
    
    args = parser.parse_args()
    
    if args.num_records <= 0:
        print("Error: Number of records must be positive")
        sys.exit(1)
    
    # Generate contacts
    generated_contacts = generate_contacts(args.num_records, args.duplicate)
    
    # Count types of names and duplicates for reporting
    unique_contacts = {(c['name'], c['email'], c['phone']) for c in generated_contacts}
    num_duplicates = len(generated_contacts) - len(unique_contacts)
    num_hk = sum(1 for c in generated_contacts if '(' in c['name'] or any(surname[0] in c['name'] for surname in hk_surnames))
    num_cn = sum(1 for c in generated_contacts if any(char in c['name'] for char in cn_surnames)) - num_hk
    num_western = len(generated_contacts) - num_hk - num_cn
    
    print(f"Successfully generated {args.num_records} contacts and saved to 'contacts.csv'")
    print(f"Distribution:")
    print(f"- Western names: {num_western}")
    print(f"- Mainland Chinese names: {num_cn}")
    print(f"- Hong Kong names: {num_hk}")
    if args.duplicate:
        print(f"Included {num_duplicates} duplicate records")

if __name__ == "__main__":
    main()