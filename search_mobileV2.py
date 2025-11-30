import json
import time
import logging
import random
import sys
import os
import subprocess
import importlib
import shutil


def ensure_package(module_name, package_name=None):
    try:
        return importlib.import_module(module_name)
    except ModuleNotFoundError:
        package_to_install = package_name or module_name
        print(f"Installing required package: {package_to_install}")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_to_install])
        except subprocess.CalledProcessError as install_error:
            print(f"Failed to install {package_to_install}: {install_error}")
            sys.exit(1)
        return importlib.import_module(module_name)


ensure_package("requests")
ensure_package("selenium")

import requests
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By


# A function to wait for a few seconds to avoid hammering the service
def wait_for(sec=2):
    time.sleep(sec)


# Get number of words from command line argument, default to 20 if not provided
num_words = 20  # Default for mobile
if len(sys.argv) > 1:
    try:
        num_words = int(sys.argv[1])
        if num_words <= 0:
            print("Number of words must be positive. Using default (20).")
            num_words = 20
    except ValueError:
        print("Invalid number format. Using default (20).")

# Get random words from API
randomlists_url = f"https://random-word-api.vercel.app/api?words={num_words}"
response = requests.get(randomlists_url)
words_list = json.loads(response.text)
print('{0} words selected from {1}'.format(len(words_list), randomlists_url))

# Define mobile emulation with a randomly selected mobile user agent
mobile_user_agents = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 EdgA/139.0.0.0",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 EdgA/139.0.0.0"
]

# Pick a random user agent
selected_user_agent = random.choice(mobile_user_agents)

# Configure mobile emulation settings
mobile_emulation = {
    "deviceMetrics": {"width": 1080, "height": 2400, "pixelRatio": 2.75},
    "userAgent": selected_user_agent
}

# Set up Edge options with mobile emulation and anti-detection features
from selenium.webdriver.edge.options import Options as EdgeOptions

edge_options = EdgeOptions()
edge_options.use_chromium = True
edge_options.add_experimental_option("mobileEmulation", mobile_emulation)
edge_options.add_experimental_option("excludeSwitches", ["enable-automation"])
edge_options.add_experimental_option('useAutomationExtension', False)
edge_options.add_argument("--disable-gpu")
#edge_options.add_argument("--headless")


def safe_read_json(file_path):
    try:
        with open(file_path, encoding="utf-8") as file_obj:
            return json.load(file_obj)
    except (OSError, ValueError, json.JSONDecodeError):
        return None


def discover_edge_profiles(user_data_root):
    profiles = []
    if not user_data_root or not os.path.isdir(user_data_root):
        return profiles

    profile_info_cache = {}
    local_state_path = os.path.join(user_data_root, "Local State")
    local_state = safe_read_json(local_state_path) or {}
    cached_profiles = local_state.get("profile", {}).get("profile_info_cache", {}).get("profiles", [])
    for cached_profile in cached_profiles:
        profile_dir = cached_profile.get("profile_path") or ""
        profile_dir = os.path.basename(profile_dir)
        if not profile_dir:
            continue
        profile_info_cache[profile_dir] = cached_profile

    for entry in os.listdir(user_data_root):
        profile_path = os.path.join(user_data_root, entry)
        if not os.path.isdir(profile_path):
            continue

        if entry != "Default" and not entry.startswith("Profile"):
            continue

        profile_info = profile_info_cache.get(entry, {})
        preferences_path = os.path.join(profile_path, "Preferences")
        preferences = safe_read_json(preferences_path) or {}

        display_name = profile_info.get("name") or preferences.get("profile", {}).get("name") or entry
        email = (
            preferences.get("signin", {}).get("last_known_gaia_email")
            or (preferences.get("account_info") or [{}])[0].get("email")
            or profile_info.get("user_name")
            or profile_info.get("gaia_name")
            or ""
        )
        full_name = (
            (preferences.get("account_info") or [{}])[0].get("full_name")
            or profile_info.get("gaia_name")
            or ""
        )
        gaia_id = profile_info.get("gaia_id") or profile_info.get("gaia_id_hash") or ""
        last_used = profile_info.get("last_used") or ""
        supervised_id = preferences.get("supervised_user_id") or profile_info.get("supervised_user_id") or ""

        profiles.append({
            "dir": entry,
            "display": display_name,
            "email": email,
            "full_name": full_name,
            "gaia_id": gaia_id,
            "last_used": last_used,
            "supervised_user_id": supervised_id,
        })

    profiles.sort(key=lambda item: (0 if item["dir"] == "Default" else 1, item["display"].lower(), item["dir"].lower()))
    return profiles


edge_user_data_dir = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Edge", "User Data")
available_profiles = discover_edge_profiles(edge_user_data_dir)
selected_profile_dir = None


def relaxed_copytree(src_root, dst_root):
    ignored_dirs = {
        "Cache",
        "Code Cache",
        "GPUCache",
        "Service Worker",
        "Storage",
        "Network",
        "IndexedDB",
        "ShaderCache",
        "DawnCache",
        "GrShaderCache",
        "Safe Browsing Network",
        "Sessions",
    }

    for root_dir, dir_names, file_names in os.walk(src_root):
        rel_root = os.path.relpath(root_dir, src_root)
        if rel_root == ".":
            rel_root = ""

        dir_names[:] = [name for name in dir_names if name not in ignored_dirs]

        target_dir = os.path.join(dst_root, rel_root)
        os.makedirs(target_dir, exist_ok=True)

        for file_name in file_names:
            src_file = os.path.join(root_dir, file_name)
            dst_file = os.path.join(target_dir, file_name)
            try:
                shutil.copy2(src_file, dst_file)
            except OSError as copy_error:
                logging.debug("Skipped copying %s: %s", src_file, copy_error)


def ensure_isolated_profile(source_root, profile_dir):
    automation_root = os.path.join(os.environ.get("LOCALAPPDATA", ""), "SeleniumEdge", profile_dir)
    os.makedirs(automation_root, exist_ok=True)

    local_state_src = os.path.join(source_root, "Local State")
    local_state_dst = os.path.join(automation_root, "Local State")
    if os.path.exists(local_state_src) and not os.path.exists(local_state_dst):
        try:
            shutil.copy2(local_state_src, local_state_dst)
        except OSError as state_error:
            logging.debug("Unable to copy Local State: %s", state_error)

    profile_src = os.path.join(source_root, profile_dir)
    profile_dst = os.path.join(automation_root, profile_dir)

    if os.path.isdir(profile_src) and not os.path.isdir(profile_dst):
        relaxed_copytree(profile_src, profile_dst)

    for singleton_name in ("SingletonLock", "SingletonCookie", "SingletonSocket"):
        singleton_path = os.path.join(profile_dst, singleton_name)
        if os.path.exists(singleton_path):
            try:
                os.remove(singleton_path)
            except OSError as singleton_error:
                logging.debug("Failed removing %s: %s", singleton_path, singleton_error)

    return automation_root

if len(available_profiles) == 1:
    selected_profile_dir = available_profiles[0]["dir"]
    print(f"Using Edge profile: {available_profiles[0]['display']} ({selected_profile_dir})")
elif len(available_profiles) > 1:
    print("Available Edge profiles:")
    for idx, profile in enumerate(available_profiles, start=1):
        print(f"{idx}. {profile['display']} ({profile['dir']})")
        if profile.get("email"):
            print(f"   Email: {profile['email']}")
        if profile.get("full_name") and profile["full_name"] != profile.get("email"):
            print(f"   Name: {profile['full_name']}")
        if profile.get("gaia_id"):
            print(f"   Account ID: {profile['gaia_id']}")
        if profile.get("last_used"):
            print(f"   Last Used: {profile['last_used']}")
        if profile.get("supervised_user_id"):
            print(f"   Supervised ID: {profile['supervised_user_id']}")

    default_index = next((i for i, profile in enumerate(available_profiles) if profile["dir"] == "Default"), 0)
    print("Type the number of the profile you want to use and press Enter.")

    while True:
        user_choice = input(f"Select profile number [{default_index + 1}]: ").strip()
        if not user_choice:
            selected_profile_dir = available_profiles[default_index]["dir"]
            break
        try:
            choice_index = int(user_choice)
        except ValueError:
            print("Please enter a valid number.")
            continue

        if 1 <= choice_index <= len(available_profiles):
            selected_profile_dir = available_profiles[choice_index - 1]["dir"]
            print(f"Selected option {choice_index}: {available_profiles[choice_index - 1]['display']} ({selected_profile_dir})")
            break

        print("Please choose a number from the list.")

if selected_profile_dir:
    selected_profile = next((profile for profile in available_profiles if profile["dir"] == selected_profile_dir), None)
    if selected_profile:
        print(f"Using Edge profile: {selected_profile['display']} ({selected_profile_dir})")

    isolated_user_data_dir = ensure_isolated_profile(edge_user_data_dir, selected_profile_dir)
    edge_options.add_argument(f"--user-data-dir={isolated_user_data_dir}")
    edge_options.add_argument(f"--profile-directory={selected_profile_dir}")

    print("Edge launch args:", edge_options.arguments)


# Create Edge WebDriver instance with options (Selenium Manager will locate the driver)
driver = webdriver.Edge(options=edge_options)

# Set window size with slight randomization to appear more natural
window_width = random.randint(350, 390)
window_height = random.randint(620, 680)
driver.set_window_size(window_width, window_height)

# Add custom script to hide automation indicators
driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
    "source": """
    // Hide webdriver property
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    """
})

# Load Bing rewards page
driver.get("https://rewards.bing.com")
# Wait a randomized time on first page load
initial_wait = random.randint(8, 15)
wait_for(initial_wait)

# Perform mobile search actions
for num, word in enumerate(words_list):
    # Vary wait times between searches to mimic human behavior
    wait = random.randint(10, 30)
    print('{0}. Searching for: {1}, {2} secs'.format(str(num + 1), word, str(wait)))
    try:
        # Navigate to Bing
        driver.get("http://www.bing.com/")
        # Random wait before starting to type
        wait_for(random.uniform(1.5, 4.0))

        # Find search box
        search_box = driver.find_element(By.ID, "sb_form_q")
        search_box.clear()

        # Type search term with human-like timing
        for char in word:
            search_box.send_keys(char)
            # Mobile typing is usually a bit slower than desktop
            time.sleep(random.uniform(0.08, 0.35))

        # Occasionally "think" before pressing enter
        if random.random() < 0.3:  # 30% chance to pause longer
            time.sleep(random.uniform(1.0, 2.5))
        else:
            time.sleep(random.uniform(0.3, 1.0))

        search_box.send_keys(Keys.ENTER)

        # Occasionally scroll down on results page
        if random.random() < 0.4:  # 40% chance to scroll
            # Wait before scrolling
            time.sleep(random.uniform(2.0, 5.0))
            # Execute some scrolling
            scroll_amount = random.randint(300, 1000)
            driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
    except Exception as e1:
        logging.error('An error occurred: %s', e1)

    # Wait between searches with slight randomization
    wait_for(wait)

# Close the browser
driver.quit()
print("Done!")
