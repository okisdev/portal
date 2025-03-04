import csv
import random
import sys
import argparse
from typing import List, Dict, Tuple, Union

# Global name data
WESTERN_FIRST_NAMES = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Christopher",
    "Margaret",
    "Daniel",
    "Sarah",
    "Paul",
    "Lisa",
    "Mark",
    "Nancy",
    "Donald",
    "Karen",
    "George",
    "Betty",
    "Kenneth",
    "Helen",
    "Steven",
    "Sandra",
    "Edward",
    "Donna",
    "Brian",
    "Carol",
    "Ronald",
    "Ruth",
    "Anthony",
    "Sharon",
    "Kevin",
    "Michelle",
    "Jason",
    "Laura",
    "Matthew",
    "Amanda",
    "Gary",
    "Dorothy",
    "Timothy",
    "Gloria",
    "Jose",
    "Emma",
    "Larry",
    "Angela",
    "Jeffrey",
    "Melissa",
    "Frank",
    "Brenda",
    "Scott",
    "Amy",
    "Eric",
    "Anna",
    "Stephen",
    "Rebecca",
    "Andrew",
    "Virginia",
    "Raymond",
    "Kathleen",
    "Gregory",
    "Pamela",
    "Joshua",
    "Martha",
    "Jerry",
    "Debra",
    "Dennis",
    "Rachel",
    "Walter",
    "Katherine",
    "Peter",
    "Christine",
    "Harold",
    "Catherine",
    "Douglas",
    "Frances",
    "Henry",
    "Alice",
    "Carl",
    "Julie",
    "Arthur",
    "Jean",
    "Ryan",
    "Heather",
    "Roger",
    "Victoria",
]
WESTERN_LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
    "Gomez",
    "Phillips",
    "Evans",
    "Turner",
    "Diaz",
    "Parker",
    "Cruz",
    "Edwards",
    "Collins",
    "Reyes",
    "Stewart",
    "Morris",
    "Morales",
    "Murphy",
    "Cook",
    "Rogers",
    "Gutierrez",
    "Ortiz",
    "Morgan",
    "Cooper",
    "Peterson",
    "Bailey",
    "Reed",
    "Kelly",
    "Howard",
    "Ramos",
    "Kim",
    "Cox",
    "Ward",
    "Richardson",
    "Watson",
    "Brooks",
    "Chavez",
    "Wood",
    "Bennett",
    "Gray",
    "Mendoza",
    "Ruiz",
    "Hughes",
    "Price",
    "Sanders",
    "Myers",
]

# Sources for contacts
SOURCES = [
    "Pitching",
    "Referral",
    "Website",
    "Email",
    "IG",
    "LinkedIn",
    "Facebook",
    "Other",
]

# Simple remarks
REMARKS = [
    "Potential client",
    "Follow up needed",
    "Interested in services",
    "Meeting scheduled",
    "Call back requested",
    "Send information",
    "High priority",
    "New contact",
    "VIP client",
    "Waiting for response",
    "Check back next week",
    "Requires attention",
    "Good lead",
    "To be contacted",
    "Left message",
]

# Mainland Chinese names (simplified)
CN_SURNAMES = [
    "王",
    "李",
    "张",
    "刘",
    "陈",
    "杨",
    "黄",
    "赵",
    "吴",
    "周",
    "林",
    "徐",
    "孙",
    "马",
    "胡",
    "郭",
    "何",
    "高",
    "罗",
    "郑",
    "梁",
    "谢",
    "宋",
    "唐",
    "许",
    "韩",
    "冯",
    "邓",
    "曹",
    "彭",
    "曾",
    "萧",
    "田",
    "董",
    "潘",
    "袁",
    "于",
    "蒋",
    "蔡",
    "余",
    "杜",
    "叶",
    "程",
    "苏",
    "魏",
    "吕",
    "丁",
    "任",
    "沈",
    "姚",
    "卢",
    "姜",
    "崔",
    "钟",
    "谭",
    "陆",
    "汪",
    "范",
    "金",
    "石",
    "廖",
    "贾",
    "夏",
    "韦",
    "付",
    "方",
    "白",
    "邹",
    "孟",
    "熊",
    "秦",
    "邱",
    "江",
    "尹",
    "薛",
]
CN_GIVEN_CHARS = [
    "伟",
    "芳",
    "娜",
    "秀英",
    "敏",
    "静",
    "丽",
    "强",
    "磊",
    "军",
    "洋",
    "勇",
    "艳",
    "杰",
    "涛",
    "明",
    "超",
    "霞",
    "平",
    "刚",
    "桂英",
    "建华",
    "国强",
    "玉兰",
    "建国",
    "建军",
    "建华",
    "秀兰",
    "秀珍",
    "凤英",
    "建平",
    "建军",
    "国庆",
    "国华",
    "玉英",
    "玉华",
    "建设",
    "国英",
    "玉珍",
    "凤",
    "建",
    "华",
    "英",
    "德",
    "文",
    "辉",
    "宇",
    "新",
    "海",
    "龙",
    "晓",
    "东",
    "阳",
    "荣",
    "力",
    "飞",
    "成",
    "康",
    "安",
    "民",
    "春",
    "晖",
    "腾",
    "旭",
    "盛",
    "达",
    "斌",
    "波",
    "宁",
    "道",
]

# Hong Kong names (traditional + English)
HK_SURNAMES = [
    ("陳", "Chan", "Chan"),
    ("李", "Lee", "Lee"),
    ("黃", "Wong", "Wong"),
    ("張", "Cheung", "Cheung"),
    ("劉", "Lau", "Lau"),
    ("周", "Chow", "Chow"),
    ("吳", "Ng", "Ng"),
    ("葉", "Yip", "Yip"),
    ("林", "Lam", "Lam"),
    ("梁", "Leung", "Leung"),
    ("鄭", "Cheng", "Cheng"),
    ("何", "Ho", "Ho"),
    ("馮", "Fung", "Fung"),
    ("朱", "Chu", "Chu"),
    ("羅", "Law", "Law"),
    ("鍾", "Chung", "Chung"),
    ("譚", "Tam", "Tam"),
    ("蕭", "Siu", "Siu"),
    ("韓", "Hon", "Hon"),
    ("江", "Kong", "Kong"),
    ("蔡", "Choi", "Choi"),
    ("潘", "Poon", "Poon"),
    ("彭", "Pang", "Pang"),
    ("賴", "Lai", "Lai"),
    ("顏", "Ngan", "Ngan"),
    ("魏", "Ngai", "Ngai"),
    ("丁", "Ting", "Ting"),
    ("范", "Fan", "Fan"),
    ("方", "Fong", "Fong"),
    ("任", "Yam", "Yam"),
]

HK_GIVEN_NAMES = [
    ("家明", "Ka Ming", "Kevin"),
    ("志豪", "Chi Ho", "Howard"),
    ("詠詩", "Wing Sze", "Wincy"),
    ("美玲", "Mei Ling", "Mary"),
    ("嘉欣", "Ka Yan", "Karen"),
    ("俊傑", "Chun Kit", "Keith"),
    ("穎恩", "Wing Yan", "Vivian"),
    ("志強", "Chi Keung", "Chris"),
    ("美華", "Mei Wah", "May"),
    ("浩然", "Ho Yin", "Henry"),
    ("志明", "Chi Ming", "Jimmy"),
    ("慧珊", "Wai Shan", "Susan"),
    ("嘉慧", "Ka Wai", "Cathy"),
    ("俊傑", "Chun Kit", "Jack"),
    ("詠恩", "Wing Yan", "Wendy"),
    ("家俊", "Ka Chun", "Carson"),
    ("美儀", "Mei Yee", "Mabel"),
    ("志成", "Chi Shing", "Jason"),
    ("淑芬", "Shuk Fan", "Sophie"),
    ("建華", "Kin Wah", "Kenny"),
    ("慧敏", "Wai Man", "Mandy"),
    ("志偉", "Chi Wai", "Wilson"),
    ("美珊", "Mei Shan", "Michelle"),
    ("家樂", "Ka Lok", "Carlos"),
    ("詠雯", "Wing Man", "Venus"),
    ("志華", "Chi Wah", "Walter"),
    ("淑儀", "Shuk Yee", "Shirley"),
    ("建國", "Kin Kwok", "Kenneth"),
    ("慧貞", "Wai Ching", "Ginger"),
    ("志傑", "Chi Kit", "Jacky"),
]


def generate_contacts(
    num_records: int,
    allow_duplicates: Union[bool, int] = False,
    use_country_code: bool = True,
    use_email: bool = True,
    use_phone: bool = True,
    output_file: str = "contacts.csv",
) -> List[Dict]:
    """
    Generate a CSV file with random contact information including names, emails, and phone numbers.

    Args:
        num_records: Number of records to generate
        allow_duplicates: If True, randomly include duplicates. If int, generate exactly that many duplicates
        use_country_code: If True, include country code in phone numbers. If False, use HK format without country code
        use_email: If True, generate email addresses. If False, email will be None
        use_phone: If True, generate phone numbers. If False, phone will be None
        output_file: Path to output CSV file
    """
    # Email domains
    email_domains = {
        "international": [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "outlook.com",
            "icloud.com",
            "protonmail.com",
            "aol.com",
            "mail.com",
            "zoho.com",
            "me.com",
            "live.com",
            "msn.com",
            "ymail.com",
            "inbox.com",
            "fastmail.com",
        ],
        "china": [
            "qq.com",
            "163.com",
            "126.com",
            "sina.com",
            "sohu.com",
            "yeah.net",
            "139.com",
            "189.cn",
            "aliyun.com",
            "foxmail.com",
            "21cn.com",
            "wo.cn",
            "china.com",
            "chinaren.com",
            "tom.com",
        ],
        "hk": [
            "yahoo.com.hk",
            "netvigator.com",
            "hku.hk",
            "cuhk.edu.hk",
            "polyu.edu.hk",
            "cityu.edu.hk",
            "hkbu.edu.hk",
            "ust.hk",
            "hkust.hk",
            "eduhk.hk",
            "connect.hku.hk",
            "link.cuhk.edu.hk",
            "pchome.com.hk",
            "hkbn.net",
            "smartone.com",
        ],
        "business": [
            "company.com",
            "enterprise.com",
            "corp.com",
            "business.com",
            "office.com",
            "work.com",
            "professional.com",
            "consultant.com",
            "agency.com",
            "group.com",
        ],
    }

    def generate_single_contact() -> Dict:
        """Generate a single contact record"""
        name_type = random.choices(
            ["western", "chinese", "hongkong"], weights=[0.3, 0.3, 0.4]
        )[0]

        if name_type == "western":
            first_name = random.choice(WESTERN_FIRST_NAMES)
            last_name = random.choice(WESTERN_LAST_NAMES)
            full_name = f"{first_name} {last_name}"
            if use_email:
                email_name = f"{first_name.lower()}.{last_name.lower()}"
                # 20% chance of using a business email
                email_domain = random.choice(
                    email_domains["business"]
                    if random.random() < 0.2
                    else email_domains["international"]
                )
                email = f"{email_name}@{email_domain}"
            else:
                email = None
            country_code = (
                random.choice(["+1", "+44", "+61", "+33", "+49"])
                if use_country_code
                else None
            )

        elif name_type == "chinese":
            surname = random.choice(CN_SURNAMES)
            given_name = random.choice(CN_GIVEN_CHARS)
            full_name = f"{surname}{given_name}"
            if use_email:
                pinyin_mapping = {
                    "王": "wang",
                    "李": "li",
                    "张": "zhang",
                    "刘": "liu",
                    "陈": "chen",
                    "杨": "yang",
                    "黄": "huang",
                    "赵": "zhao",
                    "吴": "wu",
                    "周": "zhou",
                    "林": "lin",
                    "徐": "xu",
                    "孙": "sun",
                    "马": "ma",
                    "胡": "hu",
                    "郭": "guo",
                    "何": "he",
                    "高": "gao",
                    "罗": "luo",
                    "郑": "zheng",
                    "梁": "liang",
                    "谢": "xie",
                    "宋": "song",
                    "唐": "tang",
                    "许": "xu",
                    "韩": "han",
                    "冯": "feng",
                    "邓": "deng",
                    "曹": "cao",
                    "彭": "peng",
                    "曾": "zeng",
                    "萧": "xiao",
                    "田": "tian",
                    "董": "dong",
                    "潘": "pan",
                    "袁": "yuan",
                    "于": "yu",
                    "蒋": "jiang",
                    "蔡": "cai",
                    "余": "yu",
                    "杜": "du",
                    "叶": "ye",
                    "程": "cheng",
                    "苏": "su",
                    "魏": "wei",
                    "吕": "lv",
                    "丁": "ding",
                    "任": "ren",
                    "沈": "shen",
                    "姚": "yao",
                    "卢": "lu",
                    "姜": "jiang",
                    "崔": "cui",
                    "钟": "zhong",
                    "谭": "tan",
                    "陆": "lu",
                    "汪": "wang",
                    "范": "fan",
                    "金": "jin",
                    "石": "shi",
                    "廖": "liao",
                    "贾": "jia",
                    "夏": "xia",
                    "韦": "wei",
                    "付": "fu",
                    "方": "fang",
                    "白": "bai",
                    "邹": "zou",
                    "孟": "meng",
                    "熊": "xiong",
                    "秦": "qin",
                    "邱": "qiu",
                    "江": "jiang",
                    "尹": "yin",
                    "薛": "xue",
                }

                # Different email name formats for Chinese contacts
                email_format = random.choice(
                    [
                        f"{pinyin_mapping.get(surname, 'user')}{random.randint(100, 999)}",
                        f"{pinyin_mapping.get(surname, 'user')}.{random.randint(1960, 2000)}",
                        f"{pinyin_mapping.get(surname, 'user')}_{random.randint(1, 99)}",
                    ]
                )
                email_name = email_format.lower()
                # 20% chance of using a business email
                email_domain = random.choice(
                    email_domains["business"]
                    if random.random() < 0.2
                    else email_domains["china"]
                )
                email = f"{email_name}@{email_domain}"
            else:
                email = None
            country_code = "+86" if use_country_code else None

        else:  # hongkong
            surname_tuple = random.choice(HK_SURNAMES)
            given_tuple = random.choice(HK_GIVEN_NAMES)
            full_name = f"{surname_tuple[0]}{given_tuple[0]}"  # Traditional Chinese
            roman_name = f"{surname_tuple[1]} {given_tuple[1]}"  # Romanized name
            english_name = f"{given_tuple[2]} {surname_tuple[2]}"  # English name

            # Randomly choose between different name formats for display
            full_name = random.choice(
                [
                    full_name,  # Traditional Chinese only
                    f"{full_name} ({roman_name})",  # Traditional + romanized
                    f"{full_name} ({english_name})",  # Traditional + English
                ]
            )

            if use_email:
                # For Hong Kong names, always use English name format for email
                email_name = f"{given_tuple[2].lower()}.{surname_tuple[2].lower()}"
                email_domain = random.choice(
                    email_domains["hk"] + email_domains["international"]
                )
                email = f"{email_name}@{email_domain}"
            else:
                email = None
            country_code = "+852" if use_country_code else None

        # Generate phone number based on country code
        if not use_phone:
            phone = None
        elif not use_country_code:
            # Default to Hong Kong format without country code
            phone = f"{random.choice([2,3,5,6,9])}{random.randint(1000000, 9999999)}"
        elif country_code == "+86":  # China format
            phone = f"{country_code} {random.randint(130, 199)}{random.randint(10000000, 99999999)}"
        elif country_code == "+852":  # Hong Kong format
            phone = f"{country_code} {random.choice([2,3,5,6,9])}{random.randint(1000000, 9999999)}"
        elif country_code == "+1":  # US format
            phone = f"{country_code} {random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
        else:  # International format
            phone = f"{country_code} {random.randint(100000000, 999999999)}"

        # Generate source and remark
        source = random.choice(SOURCES)
        remark = random.choice(REMARKS)

        return {
            "name": full_name,
            "email": email,
            "phone": phone,
            "source": source,
            "remark": remark,
        }

    contacts = []

    if allow_duplicates:
        base_contacts = [
            generate_single_contact() for _ in range(max(3, num_records // 3))
        ]
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
    with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["name", "email", "phone", "source", "remark"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(contacts)

    return contacts


def count_name_types(contacts: List[Dict]) -> Tuple[int, int, int]:
    """Count the number of each type of name in the contacts list"""
    western = 0
    chinese = 0
    hongkong = 0

    for contact in contacts:
        name = contact["name"]
        # Check Hong Kong names first (contains parentheses or matches HK surname pattern)
        if "(" in name or any(surname[0] in name for surname in HK_SURNAMES):
            hongkong += 1
        # Then check mainland Chinese names (contains Chinese characters but not HK style)
        elif any(surname in name for surname in CN_SURNAMES):
            chinese += 1
        # Otherwise assume Western name
        else:
            western += 1

    return western, chinese, hongkong


def main():
    parser = argparse.ArgumentParser(description="Generate random contact information")
    parser.add_argument("num_records", type=int, help="Number of records to generate")
    parser.add_argument(
        "--duplicate",
        nargs="?",
        const=True,
        type=int,
        metavar="N",
        help="Allow duplicate records. If N is specified, exactly N duplicates will be generated",
    )
    parser.add_argument(
        "--no-country-code",
        action="store_true",
        help="Generate phone numbers without country code (defaults to HK format)",
    )
    parser.add_argument(
        "--no-email",
        action="store_true",
        help="Generate contacts without email addresses",
    )
    parser.add_argument(
        "--no-phone",
        action="store_true",
        help="Generate contacts without phone numbers",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="contacts.csv",
        help="Specify the output CSV filename (default: contacts.csv)",
    )

    args = parser.parse_args()

    if args.num_records <= 0:
        print("Error: Number of records must be positive")
        sys.exit(1)

    # Generate contacts
    generated_contacts = generate_contacts(
        args.num_records,
        args.duplicate,
        not args.no_country_code,
        not args.no_email,
        not args.no_phone,
        args.output,
    )

    # Count types of names and duplicates for reporting
    unique_contacts = {(c["name"], c["email"], c["phone"]) for c in generated_contacts}
    num_duplicates = len(generated_contacts) - len(unique_contacts)
    num_western, num_cn, num_hk = count_name_types(generated_contacts)

    print(
        f"Successfully generated {args.num_records} contacts and saved to '{args.output}'"
    )
    print(f"Distribution:")
    print(f"- Western names: {num_western}")
    print(f"- Mainland Chinese names: {num_cn}")
    print(f"- Hong Kong names: {num_hk}")
    if args.duplicate:
        print(f"Included {num_duplicates} duplicate records")


if __name__ == "__main__":
    main()
