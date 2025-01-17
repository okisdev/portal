import csv
import random
import sys
import argparse
from typing import List, Dict

def generate_contacts(num_records: int, allow_duplicates: bool = False, output_file: str = "contacts.csv") -> List[Dict]:
    """
    Generate a CSV file with random contact information including names, emails, and phone numbers.
    
    Args:
        num_records (int): Number of contact records to generate
        allow_duplicates (bool): Whether to allow duplicate records
        output_file (str): Name of the output CSV file (default: "contacts.csv")
        
    Returns:
        List[Dict]: List of generated contact records
    """
    # Sample data for generating random names
    western_first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
                         'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica']
    western_last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
    
    # Chinese names (surname + given name characters)
    chinese_surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '林', '徐', '孙', '马', '胡']
    chinese_given_chars = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', 
                          '明', '超', '秀兰', '霞', '平', '晨', '华', '建国', '建华', '小红', '志强', '云', '鑫', '浩']
    
    # Sample email domains
    email_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'qq.com', '163.com']
    
    # Sample country codes for phone numbers
    country_codes = ['+1', '+44', '+61', '+81', '+86', '+91', '+33', '+49']
    
    def generate_single_contact() -> Dict:
        """Generate a single contact record"""
        # 40% chance of generating a Chinese name
        if random.random() < 0.4:
            surname = random.choice(chinese_surnames)
            given_name = random.choice(chinese_given_chars)
            full_name = f"{surname}{given_name}"
            
            # For email, use pinyin mappings (simplified for this example)
            pinyin_mapping = {
                '王': 'wang', '李': 'li', '张': 'zhang', '刘': 'liu', '陈': 'chen',
                '杨': 'yang', '黄': 'huang', '赵': 'zhao', '吴': 'wu', '周': 'zhou',
                '林': 'lin', '徐': 'xu', '孙': 'sun', '马': 'ma', '胡': 'hu'
            }
            email_name = pinyin_mapping.get(surname, 'user') + str(random.randint(100, 999))
            
            # Higher chance of Chinese email domains for Chinese names
            local_domains = ['qq.com', '163.com', '126.com', 'sina.com']
            email_domain = random.choice(local_domains if random.random() < 0.7 else email_domains)
            
            email = f"{email_name}@{email_domain}"
            
            # Higher chance of +86 country code for Chinese names
            country_code = '+86' if random.random() < 0.8 else random.choice(country_codes)
            
        else:
            first_name = random.choice(western_first_names)
            last_name = random.choice(western_last_names)
            full_name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}@{random.choice(email_domains)}"
            country_code = random.choice(country_codes)
        
        # Generate phone number based on country code
        if country_code == '+86':  # China format
            phone = f"{country_code} {random.randint(130, 199)}{random.randint(10000000, 99999999)}"
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
        # Generate a smaller set of unique contacts
        base_contacts = [generate_single_contact() for _ in range(max(3, num_records // 3))]
        
        # Fill the rest with a mix of unique and duplicate contacts
        contacts = []
        for _ in range(num_records):
            if random.random() < 0.3:  # 30% chance of duplicate
                contacts.append(random.choice(base_contacts).copy())
            else:
                contacts.append(generate_single_contact())
    else:
        # Generate all unique contacts
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
    
    # Count duplicates and Chinese names for reporting
    unique_contacts = {(c['name'], c['email'], c['phone']) for c in generated_contacts}
    num_duplicates = len(generated_contacts) - len(unique_contacts)
    num_chinese = sum(1 for c in generated_contacts if any(char in c['name'] for char in '王李张刘陈杨黄赵吴周林徐孙马胡'))
    
    print(f"Successfully generated {args.num_records} contacts and saved to 'contacts.csv'")
    print(f"Generated {num_chinese} Chinese names")
    if args.duplicate:
        print(f"Included {num_duplicates} duplicate records")

if __name__ == "__main__":
    main()