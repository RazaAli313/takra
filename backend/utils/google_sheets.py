import os
import json
from typing import List, Dict

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except Exception:
    # If the packages are not installed, functions will raise on use.
    service_account = None
    build = None


def _load_service_account_credentials():
    """Load service account credentials from env or file.

    - If GOOGLE_SERVICE_ACCOUNT_FILE is set, load the JSON from that path.
    - Else if GOOGLE_SERVICE_ACCOUNT_INFO is set, parse JSON from the env var.
    Returns google.oauth2.service_account.Credentials or raises ValueError.
    """
    if service_account is None:
        raise RuntimeError('google-auth or google-api-python-client not installed')

    file_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE')
    info = os.getenv('GOOGLE_SERVICE_ACCOUNT_INFO')

    if file_path and os.path.exists(file_path):
        creds = service_account.Credentials.from_service_account_file(
            file_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        return creds
    if info:
        try:
            info_json = json.loads(info)
            creds = service_account.Credentials.from_service_account_info(
                info_json,
                scopes=["https://www.googleapis.com/auth/spreadsheets"]
            )
            return creds
        except Exception as e:
            raise ValueError('Invalid GOOGLE_SERVICE_ACCOUNT_INFO JSON: ' + str(e))

    raise ValueError('Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_INFO for Google Sheets service account')


def sync_registrations_to_sheet(registrations: List[Dict], spreadsheet_id: str, sheet_range: str = 'Sheet1!A:Z') -> Dict:
    """Append registrations to a Google Sheet.

    registrations: list of dicts with keys like name, roll_no, campus, email, phone, position_applied, portfolio, linkedin, picture_url, experience_alignment, other_society, why_join, expertise, best_thing, improve, created_at
    spreadsheet_id: the Google Sheet ID
    sheet_range: A1 notation range to append to (default: Sheet1!A:Z)

    Returns a dict with result info (updatedRows etc) or raises Exception on failure.
    """
    if build is None or service_account is None:
        raise RuntimeError('google-auth or google-api-python-client not installed')

    creds = _load_service_account_credentials()
    service = build('sheets', 'v4', credentials=creds)
    sheet = service.spreadsheets()

    # Prepare rows: maybe include header row first if sheet empty, but we'll append rows
    values = []
    for r in registrations:
        values.append([
            r.get('name', ''),
            r.get('roll_no', ''),
            r.get('campus', ''),
            r.get('email', ''),
            r.get('phone', ''),
            r.get('position_applied', ''),
            r.get('portfolio', ''),
            r.get('linkedin', ''),
            r.get('picture_url', ''),
            r.get('experience_alignment', ''),
            r.get('other_society', ''),
            r.get('why_join', ''),
            r.get('expertise', ''),
            r.get('best_thing', ''),
            r.get('improve', ''),
            r.get('created_at').isoformat() if r.get('created_at') else ''
        ])

    body = {
        'values': values
    }

    result = sheet.values().append(
        spreadsheetId=spreadsheet_id,
        range=sheet_range,
        valueInputOption='RAW',
        insertDataOption='INSERT_ROWS',
        body=body
    ).execute()

    return result
