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
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=32,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#4C1D95')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#6B7280')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E1B4B'),
        spaceAfter=4,
        spaceBefore=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#374151')
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#7C2D12') if record.support_indicator == 'HIGH' else (colors.HexColor('#92400E') if record.support_indicator == 'MODERATE' else colors.HexColor('#065F46'))
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#4B5563')
    )

    story = []

    # 1. Header
    story.append(Paragraph("AutiCare — AI Behavioral Screening Report", title_style))
    created_str = record.created_at.strftime('%B %d, %Y at %H:%M UTC') if getattr(record, 'created_at', None) else datetime.utcnow().strftime('%B %d, %Y')
    story.append(Paragraph(f"Report ID: #{record.id} &bull; Pipeline: Multi-Model Behavioral Analysis (PBR4RRB + ASDMotion) &bull; Date: {created_str}", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#8B5CF6'), spaceAfter=8))

    # 2. Child Profile Info Table
    child_name = child.name if child else "Child Profile"
    child_age = f"{child.age} years" if child and child.age else "Not specified"
    child_gender = child.gender if child and child.gender else "Not specified"

    meta_data = [
        [Paragraph("<b>Child Name:</b>", body_style), Paragraph(child_name, body_style),
         Paragraph("<b>Assessment Type:</b>", body_style), Paragraph("Multi-Model Video Behavioral Analysis", body_style)],
        [Paragraph("<b>Age / Gender:</b>", body_style), Paragraph(f"{child_age} / {child_gender}", body_style),
         Paragraph("<b>Pipeline Engine:</b>", body_style), Paragraph("AI4ASD pbr4RRB + ASDMotion PoseC3D", body_style)],
        [Paragraph("<b>Project Screening Indicator:</b>", body_style), Paragraph(f"<b>{record.percentage}%</b> ({record.support_indicator} Support)", body_style),
         Paragraph("<b>Model Confidence:</b>", body_style), Paragraph(f"{record.confidence_score or 0}%", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[100, 160, 115, 165])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F3FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#DDD6FE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EDE9FE')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Overall Support Level Callout
    support_bg = colors.HexColor('#FEF3C7') if record.support_indicator in ['HIGH', 'MODERATE'] else colors.HexColor('#D1FAE5')
    support_border = colors.HexColor('#F59E0B') if record.support_indicator in ['HIGH', 'MODERATE'] else colors.HexColor('#10B981')
    callout_data = [[
        Paragraph(
            f"PROJECT SCREENING INDICATOR: {record.percentage}% &bull; {record.support_indicator} SUPPORT LEVEL<br/>"
            f"<font size='7.5' color='#4B5563'><i>Rule-based algorithmic screening metric combining motor behavior classifications. Model Confidence: {record.confidence_score or 0}%.</i></font>",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[540])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), support_bg),
        ('BOX', (0, 0), (-1, -1), 1.5, support_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 8))

    # 4. Multi-Model Pipeline Outputs Table
    story.append(Paragraph("Independent AI Models Output (Multi-Model Architecture)", section_heading))
    raw = record.raw_output if isinstance(record.raw_output, dict) else {}
    video_analysis = raw.get("video_analysis", {})

    pbr4 = video_analysis.get("pbr4rrb") or {}
    pbr4_out = pbr4.get("output") or raw.get("raw_model_metrics") or {}
    pbr4_metrics = pbr4_out.get("raw_model_metrics", pbr4_out)
    pbr4_top = pbr4_metrics.get("top_action") or pbr4_out.get("top_action", "None")
    pbr4_probs = pbr4_metrics.get("action_probabilities", {})
    pbr4_conf = f"{(pbr4_probs.get(pbr4_top, 0.0) * 100):.1f}%" if pbr4_top in pbr4_probs else "N/A"
    pbr4_osc = f"{float(pbr4_metrics.get('peak_oscillation_power', 0.0)):.3f}"
    pbr4_status_text = "<font color='#059669'><b>COMPLETED</b></font>" if pbr4.get("status") in ("completed", "available") else f"<font color='#DC2626'><b>{pbr4.get('status', 'PENDING').upper()}</b></font>"

    asd = video_analysis.get("asd_motion") or {}
    asd_out = asd.get("output") or {}
    asd_detected = "Stereotypical Detected" if asd_out.get("smm_detected") else "No SMM Movement"
    asd_avg = f"{float(asd_out.get('average_stereotypical_score', 0.0)):.5f}"
    asd_peak = f"{float(asd_out.get('max_stereotypical_score', 0.0)):.5f}"
    asd_segs = str(asd_out.get("smm_count", 0))
    asd_status_text = "<font color='#059669'><b>COMPLETED</b></font>" if asd.get("status") in ("completed", "available") else f"<font color='#D97706'><b>{asd.get('status', 'NOT_AVAILABLE').upper()}</b></font>"

    av = video_analysis.get("av_asd") or {}
    av_status_text = "<font color='#6B7280'><b>NOT_AVAILABLE</b></font>"
    av_details = "AV-ASD model weights/architecture are not currently available in the repository."

    models_data = [
        [Paragraph("<b>Model Name & Architecture</b>", body_style), Paragraph("<b>Target Behavioral Domain</b>", body_style), Paragraph("<b>Status & Detailed Output</b>", body_style)],
        [
            Paragraph("<b>1. AI4ASD PBR4RRB</b><br/><font size='7' color='#6B7280'>RepDetectNet + Video Swin-3D</font>", body_style),
            Paragraph("Restricted & Repetitive Motor Behaviors (RRB)", body_style),
            Paragraph(f"Status: {pbr4_status_text}<br/>Detected Action: <b>{pbr4_top}</b><br/>Top Confidence: <b>{pbr4_conf}</b> &bull; Oscillation: <b>{pbr4_osc}</b>", body_style)
        ],
        [
            Paragraph("<b>2. ASDMotion</b><br/><font size='7' color='#6B7280'>OpenPose + MMAction2 PoseC3D</font>", body_style),
            Paragraph("Stereotypic Motor Movements (SMM)", body_style),
            Paragraph(f"Status: {asd_status_text}<br/>SMM Movement: <b>{asd_detected}</b><br/>Avg Score: <b>{asd_avg}</b> &bull; Peak: <b>{asd_peak}</b> (Segments: {asd_segs})", body_style)
        ],
        [
            Paragraph("<b>3. AV-ASD</b><br/><font size='7' color='#6B7280'>Audio-Visual Multimodal</font>", body_style),
            Paragraph("Audio-Visual Behavioral Markers", body_style),
            Paragraph(f"Status: {av_status_text}<br/><i>{av_details}</i>", body_style)
        ],
    ]
    models_table = Table(models_data, colWidths=[140, 160, 240])
    models_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4C1D95')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(models_table)
    story.append(Spacer(1, 8))

    # 5. Clinical Summary & Recommendations
    story.append(Paragraph("Behavioral Screening Summary", section_heading))
    story.append(Paragraph(record.summary or "Analysis complete.", body_style))
    story.append(Spacer(1, 6))

    if record.recommendations:
        story.append(Paragraph("Actionable Recommendations & Next Steps", section_heading))
        for rec in record.recommendations:
            story.append(Paragraph(f"&bull; {rec}", body_style))
            story.append(Spacer(1, 1.5))
        story.append(Spacer(1, 6))

    # 6. Pipeline Timing Summary
    timing = raw.get("timing", {})
    if timing:
        pbr_time = timing.get("pbr4rrb_seconds", timing.get("inference_seconds", 0))
        asd_time = timing.get("asd_motion_seconds", 0)
        tot_time = timing.get("pipeline_total_seconds", timing.get("total_seconds", timing.get("total_analysis_seconds", 0)))
        timing_str = f"<b>Execution Profile:</b> PBR4RRB: {pbr_time}s &bull; ASDMotion: {asd_time}s &bull; AV-ASD: 0.0s &bull; Total Analysis: {tot_time}s"
        story.append(Paragraph(timing_str, subtitle_style))
        story.append(Spacer(1, 6))

    # 7. Mandatory Clinical Disclaimer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceAfter=6))
    disclaimer_text = (
        "<b>CLINICAL NOTICE & MEDICAL DISCLAIMER:</b> "
        "This AI-assisted behavioral screening result is not a clinical diagnosis of Autism Spectrum Disorder (ASD). "
        "Neither PBR4RRB nor ASDMotion provides diagnostic autism probability. "
        "The Project Screening Indicator is a computational estimate intended solely to assist clinical consultations and early intervention planning. "
        "Always consult a board-certified pediatric neurologist, developmental pediatrician, or licensed clinical psychologist."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
