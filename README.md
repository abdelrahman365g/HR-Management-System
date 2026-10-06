# HRMS User Guide

HRMS is a web application for HR teams. It keeps **employee records**, tracks **attendance and departure**, and produces **salary reports and payslips** you can print. This guide explains how to use each screen.

## Try the demo

You can explore HRMS without setting anything up:

- **Address:** https://hr-management-system.abdelrahman365g.de5.net/
- **Email:** `intern@company.com`
- **Password:** `intern123`

The demo account is **read-only**: you can open and browse the screens it has access to, but add, edit, and delete buttons are not available.

## Contents

1. [Signing in and finding your way around](#1-signing-in-and-finding-your-way-around)
2. [Who can do what](#2-who-can-do-what)
3. [Dashboard](#3-dashboard)
4. [Employees](#4-employees)
5. [Departments](#5-departments)
6. [Attendance](#6-attendance)
7. [Salary reports](#7-salary-reports)
8. [Official holidays](#8-official-holidays)
9. [General settings](#9-general-settings)
10. [Users](#10-users)
11. [Permission groups](#11-permission-groups)
12. [Tips and troubleshooting](#12-tips-and-troubleshooting)
13. [Glossary](#13-glossary)

---

## 1. Signing in and finding your way around

### Sign in

1. Open the application in your browser.
2. Enter your **username** and **password**, then sign in.
3. If either field is empty or wrong, a message asks you to enter a valid username and password.

After signing in you land on the **Dashboard**.

### The layout

- **Sidebar (left, or right in Arabic):** your menu. It only lists the screens you are allowed to open.
- **Main area:** the screen you selected.
- **Your name (bottom of the sidebar):** click it to open a small menu with **Language**, **Theme**, and **Logout**.

On a phone or a narrow window the sidebar is hidden; use the menu button at the top to open it.

### Language

Open the menu at the bottom of the sidebar, choose **Language**, then pick **English** or **العربية**. The whole page switches immediately. In Arabic, the layout flips from right to left. Your choice is remembered. If a label has no Arabic translation, it is shown in English.

On the sign-in page there is a language switch in the top corner.

### Theme

Open the same menu, choose **Theme**, and pick **Light**, **Dark**, or **System** (follows your device). Your choice is remembered.

### Confirmations

Before an edit, delete, or import is applied, a dialog asks you to confirm. Press **Cancel** (or Esc) to back out. Deleting cannot be undone.

---

## 2. Who can do what

There are two kinds of users:

- **HR admin:** can open every screen, edit any record, and edit existing attendance records.
- **Regular users:** belong to a **permission group** that decides, for each screen, whether they can **view** it, **edit** it, both, or neither.

| Screen | View lets you | Edit lets you |
| --- | --- | --- |
| Employees (and Departments) | See employees and departments | Add, change, delete |
| Attendance | Search records, see the clock page | Record check-in/out, add records, import from Excel |
| Salary reports | See reports, print PDFs | Save monthly snapshots |
| Official holidays | See the holidays | Add and delete |
| Settings | See the rules | Change them |
| Users | See the user list | Add, change, delete |
| Permission groups | See the groups | Add, change, delete |

Notes:

- The **Dashboard** is available to everyone. Each card appears only if you may view that information.
- **Editing an existing attendance record** (correcting a time or adding a note) is reserved for HR admins.
- Screens that show employee names (Attendance, Salary reports) need **Employees → View** as well. If a list looks empty, ask your HR admin to check your group.

---

## 3. Dashboard

The Dashboard is the first screen you see. It shows cards for the information you may view:

- **Today's attendance:** how many employees are expected, how many have checked in and out, and how many have not checked in. On a holiday this shows zeros and a banner tells you that today is a holiday.
- **Headcount:** the total number of employees and how many are in each department.
- **Upcoming holidays:** the next official holidays and how many days away they are.
- **Salary reports:** how many salary snapshots are saved for the previous month and how many are still pending.

Use the links on the cards to jump to the related screen.

---

## 4. Employees

### Browse and search

The list shows each employee's name, department, phone, national ID, contract date, and base salary. Search by name or filter by department.

### Add or edit an employee

Click **Add**, or choose **Edit** on a row. The form has two parts. **Every field is required**; a message appears under any field that is empty or invalid.

**Personal data**

| Field | Rule |
| --- | --- |
| Full name | Required |
| Address | Required |
| Phone number | Digits only, at least 11 digits |
| Date of birth | The employee must be at least 20 years old |
| Gender | Male or female |
| National ID | Exactly 14 digits, and unique (two employees cannot share one) |
| Nationality | Required |

**Work data**

| Field | Rule |
| --- | --- |
| Department | Choose from the list (add departments first, see [Departments](#5-departments)) |
| Contract date | Not earlier than the company founding date (1 January 2008) |
| Base salary | Numbers only, greater than zero |
| Check-in time | The scheduled start of the working day |
| Check-out time | The scheduled end of the day; it must be later than the check-in time |

Editing asks for confirmation before it is saved.

### Delete an employee

Choose **Delete** on the row and confirm. Deleting an employee also removes their attendance records and salary snapshots, so be sure before you confirm.

---

## 5. Departments

Departments group your employees. You need at least one before you can add an employee.

- **Add:** type a name and click **Add**. Names must be unique.
- **Rename:** choose **Rename** on the row.
- **Delete:** choose **Delete** and confirm. A department that still has employees cannot be deleted; the message says it is in use. Move or remove those employees first.

---

## 6. Attendance

Attendance has four parts: the clock page, search, adding and editing records, and Excel import.

### Rules that apply everywhere

- There is **one record per employee per day**.
- **No attendance is recorded on holidays**, either weekly holidays or official holidays.
- A record needs at least a check-in or a check-out time. When both are present, check-out must be later than check-in.

### Clock page (check-in and check-out)

Use this page for day-to-day recording.

1. Open **Attendance** and choose the clock page.
2. Employees are listed by department. Type in the filter to narrow the list by department name.
3. Click **Check-in** or **Check-out** next to an employee.

The time is taken from the system clock, not from your device, and cannot be typed in. Once recorded, the button shows **Checked-in** or **Checked-out** and cannot be used again for that day. If a time is wrong, ask an HR admin to correct the record.

### Search records

1. Optionally enter an **employee name**, choose a **department**, and set a **from** and **to** date.
2. Click **Show**.

If you leave everything empty, the results show **the current month for all departments**.

You may see these messages:

- *Please enter a valid employee name*: no employee matches what you typed. The table is cleared.
- *Please enter a valid date*: the **from** date is after the **to** date.

Results are paged; use the page controls under the table.

### Add a record

Click **Add Record**, then choose the employee and date, enter the check-in and/or check-out time, and optionally add a **note** (for example, "badge reader was not working"). Save.

You cannot add a record on a holiday or a second record for the same employee and day.

### Edit a record (HR admins only)

Choose **Edit** on a row to correct the times or change the note. The employee and date cannot be changed. You will be asked to confirm. Attendance records cannot be deleted from the screen.

### Import from Excel

Use this to load many records at once.

1. Click **Import**.
2. Click **Download template** to get a correctly formatted file, or prepare your own `.xlsx` file with these columns in the first row: `national_id`, `date`, `check_in`, `check_out`.
3. Choose your file (up to 5 MB and 5,000 rows). Dates can be real Excel dates or text such as `2026-09-20` or `20/09/2026`; times can be `09:00` or `09:00:00`.
4. Review the preview, then click **Import** and confirm.

When it finishes you get a report:

- **Inserted:** new records created.
- **Updated:** existing records replaced with the file's times. Importing the same file again is safe; it updates instead of duplicating.
- **Skipped:** rows that could not be imported, each with a reason:

| Reason | Meaning |
| --- | --- |
| National ID invalid, or no employee with this national ID | The ID is not 14 digits, or nobody has it |
| The date is a weekly or official holiday | No attendance is allowed on that day |
| Check-out must be after check-in | The times are in the wrong order |
| Neither check-in nor check-out was provided | The row has no times |
| The date is before the employee's contract date | The employee had not started yet |
| The date is in the future | You cannot record days that have not happened |
| The date is invalid | The date could not be read |

A bad row never stops the others. You can **download the skipped rows** as a CSV file to fix and re-import. Row numbers in the report count the data rows only (the header row is not counted), so add one to find the row in Excel.

---

## 7. Salary reports

### How a salary is worked out

HRMS calculates each employee's salary for a calendar month from their attendance and the rules in **General settings**.

- **Working days** are all days that are not weekly holidays or official holidays. Holidays never count as attendance or absence.
- Only days from the employee's **contract date** count. Today and future days are never counted as absent.
- **Attendance days:** working days with a check-in or check-out recorded.
- **Absence days:** working days with no record.
- **Overtime hours:** time worked after the scheduled check-out.
- **Deduction hours:** time lost by arriving after the scheduled check-in plus leaving before the scheduled check-out. If only one of the two times is recorded for a day, only that side is used.

The amounts are:

- **Overtime amount** = overtime hours ÷ overtime unit hours × overtime rate per unit
- **Deduction amount** = deduction hours ÷ deduction unit hours × deduction rate per unit
- **Absence deduction** = absence days × (base salary ÷ number of working days in that month)
- **Net salary** = base salary + overtime amount − deduction amount − absence deduction (never below zero)

In an employee's **first month**, the working days before their contract date are deducted in the same way, so they are paid only for the days they were employed.

**Example.** April 2026 has 25 working days. An employee earns 3,000, was absent 1 day, worked 4 overtime hours (rate 50 per hour), and had 2.5 deduction hours (rate 25 per hour):

| Item | Amount |
| --- | --- |
| Base salary | 3,000.00 |
| Overtime | + 200.00 |
| Deductions | − 62.50 |
| Absence (1 × 3,000 ÷ 25) | − 120.00 |
| **Net salary** | **3,017.50** |

### Monthly report

1. Open **Salary reports**.
2. Choose the **month** and **year**. Optionally enter an **employee name** or choose a **department**.
3. The table shows, for each employee: base salary, attendance days, absence days, overtime and deduction hours, the amounts, and the net salary.

Each row has a badge:

- **Live:** calculated now from current data. The current month is always live and changes until the month ends.
- **Saved:** a snapshot saved earlier. Saved figures stay the same even if settings or salaries change later.

Messages you may see: *Please enter a valid employee name*, and *Please choose a valid year* (a year before the company was founded, or a month that has not started).

### Yearly report

Switch to the **yearly** view, enter the **employee name** and the **year**. You get one row per month, from the employee's first month to December (or to the current month in the current year), plus totals for the year: total net salary, overtime, deductions, absence deductions, and attendance and absence days. If the current month is included, a notice reminds you that it is not final yet.

### Printing

- **Payslip:** use **Print** on an employee's row.
- **Monthly report:** use **Print report** to get all rows of the current filters as a PDF.
- **Yearly report:** use **Print yearly report** in the yearly view.

PDFs are produced in English.

### Save a monthly snapshot

If you have edit rights on this screen, use **Save monthly snapshot** to store the figures for the selected month. Saving the current month asks you to confirm, because the month is not finished. Saving again later replaces the saved figures with the latest calculation.

---

## 8. Official holidays

Official holidays are days off for the whole company (for example, national holidays). Nobody can be recorded as present on them, and they are never counted as absence.

- **View:** choose a year to see its holidays, in date order.
- **Add:** enter a name and a date, then add. Each date can only have one holiday, and dates before the company founding year are not accepted.
- **Delete:** choose **Delete** on the row and confirm.

Add holidays **before** importing or recording attendance for those dates.

---

## 9. General settings

### Overtime and deduction rules

These four values control the money part of salary calculation:

| Setting | Meaning |
| --- | --- |
| Overtime unit (hours) | The block of overtime hours that earns one payment |
| Overtime rate per unit | The amount paid for each overtime unit |
| Deduction unit (hours) | The block of lost hours that triggers one deduction |
| Deduction rate per unit | The amount deducted for each deduction unit |

Example: unit 1 hour and rate 50 means every hour of overtime adds 50; unit 2 hours and rate 100 means every 2 hours add 100 (3 hours add 150). Units must be greater than zero and rates cannot be negative. Every field must be filled before **Save** is enabled, and saving asks you to confirm.

### Weekly holidays

Tick the days of the week that are days off (by default Friday and Saturday) and save. Weekly holidays work like official holidays: no attendance is recorded on them and they are never counted as absence.

---

## 10. Users

*Available to users with access to the Users screen.*

- **Add a user:** enter full name, username, email, password, and choose a permission group. The user can sign in right away.
- **Edit a user:** change their name, username, email, group, or active status.
- **Delete a user:** choose **Delete** and confirm. You cannot delete your own account, and the last remaining HR admin cannot be deleted.

The table shows each user's group. HR admins are shown as **HR Admin (root)**.

---

## 11. Permission groups

*Available to users with access to the Permission groups screen.*

A permission group is a named set of rights. To create one:

1. Click **Add**.
2. Enter a **group name** (required).
3. For each screen, tick **View** and/or **Edit**. At least one permission must be selected.
4. Save.

To change a group, choose **Edit**. A group that still has users assigned cannot be deleted; move those users to another group first.

**Tip:** if a group can open Attendance or Salary reports, also give it **Employees → View**, otherwise employee names will not appear. The form shows a reminder.

---

## 12. Tips and troubleshooting

| What you see | What to do |
| --- | --- |
| A menu item is missing | Your group does not include **View** for that screen. Ask your HR admin. |
| A list or a name picker is empty | Check that your group includes **Employees → View**. |
| No **Add**, **Edit**, or **Delete** buttons | Your group has **View** but not **Edit** for that screen. |
| I cannot edit an attendance record | Only HR admins can edit existing records. |
| The Check-in button is disabled | The check-in is already recorded for today. |
| An import row says it is a holiday | That date is a weekly or official holiday. Check the holiday lists. |
| An employee shows no salary report for a month | Their contract date is after that month. |
| A saved report differs from a new calculation | Saved reports keep the figures from the day they were saved. Save a new snapshot to refresh. |
| A department or user cannot be deleted | A department with employees, your own account, and the last HR admin cannot be deleted. |
| The page looks different after switching language | Arabic mode is right-to-left; this is expected. |

Good habits:

- Add **official holidays** before recording attendance for those dates.
- Set up **General settings** before running salary reports.
- Save the **monthly snapshot** after month end, once attendance corrections are done.
- Use the **Excel template** for imports, and download the skipped rows to fix them.

---

## 13. Glossary

| Term | Meaning |
| --- | --- |
| **Working day** | A day that is not a weekly or official holiday |
| **Weekly holiday** | A day of the week that is always a day off (for example, Friday) |
| **Official holiday** | A specific date that is a company-wide day off |
| **Scheduled check-in / check-out** | The working hours set on the employee's record |
| **Overtime** | Time worked after the scheduled check-out |
| **Deduction** | Money removed for arriving late or leaving early |
| **Absence** | A working day with no attendance record |
| **Net salary** | The final amount after overtime, deductions, and absences |
| **Snapshot** | A saved copy of a month's salary figures that no longer changes |
| **Permission group** | A named set of view and edit rights given to users |
| **HR admin** | The top-level user with every right |
