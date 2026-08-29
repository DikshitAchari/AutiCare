import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.models.user import PredictionAnalysis, ChildProfile


def generate_prediction_pdf(record: PredictionAnalysis, child: ChildProfile | None = None) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#4C1D95')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#6B7280')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E1B4B'),
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#374151')
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#7C2D12') if record.support_indicator == 'HIGH' else colors.HexColor('#065F46')
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#4B5563')
    )

    story = []

    # 1. Header
    story.append(Paragraph("AutiCare — AI Screening Report", title_style))
    created_str = record.created_at.strftime('%B %d, %Y at %H:%M UTC') if record.created_at else datetime.utcnow().strftime('%B %d, %Y')
    story.append(Paragraph(f"Report ID: #{record.id} &bull; Generated on: {created_str}", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#8B5CF6'), spaceAfter=14))

    # 2. Child Profile Info Table
    child_name = child.name if child else "Child Profile"
    child_age = f"{child.age} years" if child and child.age else "Not specified"
    child_gender = child.gender if child and child.gender else "Not specified"

    meta_data = [
        [Paragraph("<b>Child Name:</b>", body_style), Paragraph(child_name, body_style),
         Paragraph("<b>Assessment Type:</b>", body_style), Paragraph("Video Behavioral Analysis", body_style)],
        [Paragraph("<b>Age:</b>", body_style), Paragraph(child_age, body_style),
         Paragraph("<b>Model Architecture:</b>", body_style), Paragraph("AI4ASD pbr4RRB (Swin-3D)", body_style)],
        [Paragraph("<b>Gender:</b>", body_style), Paragraph(child_gender, body_style),
         Paragraph("<b>Overall Score:</b>", body_style), Paragraph(f"<b>{record.percentage}%</b> ({record.support_indicator} Support)", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[90, 170, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F3FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#DDD6FE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EDE9FE')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Overall Support Level Callout
    support_bg = colors.HexColor('#FEF3C7') if record.support_indicator == 'HIGH' else colors.HexColor('#D1FAE5')
    support_border = colors.HexColor('#F59E0B') if record.support_indicator == 'HIGH' else colors.HexColor('#10B981')
    callout_data = [[Paragraph(f"CLINICAL SUPPORT INDICATOR: {record.support_indicator} SUPPORT ({record.percentage}%)", callout_style)]]
    callout_table = Table(callout_data, colWidths=[530])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), support_bg),
        ('BOX', (0, 0), (-1, -1), 1.5, support_border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 14))

    # 4. Domain Breakdown Table
    story.append(Paragraph("Domain Indicator Breakdown", section_heading))
    raw = record.raw_output if isinstance(record.raw_output, dict) else {}
    breakdown = raw.get("domain_breakdown", {})
    rrb = breakdown.get("rrb", {})
    rrb_text = f"{rrb.get('percentage', record.percentage)}% — {rrb.get('description', 'Restricted & Repetitive Behaviors')}"
    if rrb.get('action') and rrb.get('action') != "None":
        rrb_text += f" (Detected: {rrb.get('action')})"

    domain_data = [
        [Paragraph("<b>Developmental Domain</b>", body_style), Paragraph("<b>Status / Finding</b>", body_style), Paragraph("<b>Clinical Notes</b>", body_style)],
        [Paragraph("Restricted & Repetitive Behaviors", body_style), Paragraph(rrb_text, body_style), Paragraph("Evaluated via AI4ASD pbr4RRB", body_style)],
        [Paragraph("Social Interaction & Response", body_style), Paragraph("<i>Not analyzed by current model</i>", body_style), Paragraph("Requires clinical interaction evaluation", body_style)],
        [Paragraph("Non-Verbal Communication", body_style), Paragraph("<i>Not analyzed by current model</i>", body_style), Paragraph("Requires speech/gesture assessment", body_style)],
        [Paragraph("Sensory Adaptation", body_style), Paragraph("<i>Not analyzed by current model</i>", body_style), Paragraph("Requires sensory processing profiling", body_style)],
    ]
    domain_table = Table(domain_data, colWidths=[160, 220, 150])
    domain_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4C1D95')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(domain_table)
    story.append(Spacer(1, 14))

    # 5. Summary
    story.append(Paragraph("Clinical AI Summary", section_heading))
    story.append(Paragraph(record.summary, body_style))
    story.append(Spacer(1, 12))

    # 6. Recommendations
    if record.recommendations:
        story.append(Paragraph("Targeted Recommendations", section_heading))
        for rec in record.recommendations:
            story.append(Paragraph(f"&bull; {rec}", body_style))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 10))

    # 7. Mandatory Disclaimer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceAfter=10))
    disclaimer_text = (
        "<b>CLINICAL NOTICE & MEDICAL DISCLAIMER:</b> "
        "This AI-assisted screening report is generated by an automated computational screening system. "
        "It is NOT a medical, neurological, or psychiatric diagnosis of Autism Spectrum Disorder (ASD). "
        "Screening indicators are intended to guide clinical consultations and early intervention planning. "
        "Always seek the advice of a board-certified developmental pediatrician, pediatric neurologist, "
        "or licensed child psychologist for comprehensive diagnostic evaluations."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
