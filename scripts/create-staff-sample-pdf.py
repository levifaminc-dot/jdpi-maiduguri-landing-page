"""Create an explicitly fictional two-page PDF for viewer QA; no staff data."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

root = Path(__file__).resolve().parents[1]
output = root / 'output' / 'pdf' / 'staff-workspace-sample.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(output), pagesize=A4)
pdf.setTitle('JDPI Staff Workspace - Fictional Preview Guide')
pdf.setAuthor('JDPI workspace preview')
width, height = A4
green = HexColor('#0b4c35')

def frame(page, title, subtitle):
    pdf.setFillColor(green)
    pdf.rect(0, height - 180, width, 180, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#b8d6c0'))
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(46, height - 43, 'JDPI  /  STAFF WORKSPACE PREVIEW')
    pdf.setFillColor(HexColor('#ffffff'))
    pdf.setFont('Helvetica-Bold', 27)
    pdf.drawString(46, height - 89, title)
    pdf.setFont('Helvetica', 12)
    pdf.drawString(46, height - 119, subtitle)
    pdf.setFillColor(HexColor('#f6efe1'))
    pdf.roundRect(46, height - 229, width - 92, 31, 5, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#8a6a36'))
    pdf.setFont('Helvetica-Bold', 9)
    pdf.drawString(58, height - 217, 'FICTIONAL SAMPLE ONLY - NOT AN APPROVED JDPI POLICY')
    pdf.setStrokeColor(HexColor('#dde5dc'))
    pdf.line(46, 65, width - 46, 65)
    pdf.setFillColor(HexColor('#737d73'))
    pdf.setFont('Helvetica', 9)
    pdf.drawString(46, 44, 'Local design review only. No real staff or beneficiary information.')
    pdf.drawRightString(width - 46, 44, f'{page} / 2')

def section(y, number, title, lines):
    pdf.setFillColor(HexColor('#eaf2e8'))
    pdf.roundRect(46, y - 24, 29, 29, 6, fill=1, stroke=0)
    pdf.setFillColor(green)
    pdf.setFont('Helvetica-Bold', 11)
    pdf.drawString(55, y - 14, str(number))
    pdf.setFont('Helvetica-Bold', 15)
    pdf.drawString(90, y - 10, title)
    pdf.setFillColor(HexColor('#59655c'))
    pdf.setFont('Helvetica', 11)
    for i, line in enumerate(lines):
        pdf.drawString(90, y - 38 - i * 18, line)

frame(1, 'A shared space for our team.', 'Explore the preview before we connect the real workspace.')
section(height - 270, 1, 'Stay connected', ['Read updates from fictional colleagues.', 'Post a sample announcement and join the conversation.'])
section(height - 380, 2, 'Share knowledge', ['Find sample documents by title or folder.', 'Open PDFs in the viewer before choosing to download.'])
section(height - 490, 3, 'Find your people', ['Explore sample offices and departments.', 'The planned workspace will support approximately 210 staff.'])
pdf.showPage()
frame(2, 'Clear access. Shared purpose.', 'A demonstration of the intended membership workflow.')
section(height - 270, 1, 'Microsoft identity', ['Microsoft sign-in will verify a work identity.', 'A signed-in identity does not automatically grant membership.'])
section(height - 380, 2, 'Admin-controlled admission', ['Only approved admins will admit staff and assign roles.', 'This preview sends no real invitations or emails.'])
section(height - 490, 3, 'Handle information with care', ['Use fictional content while reviewing this prototype.', 'Do not add confidential HR, safeguarding or community records.'])
pdf.save()
print(output)
