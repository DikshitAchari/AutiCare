from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import TherapistAvailability, TherapistProfile, User
from app.schemas.therapist import AvailabilitySlotOut, TherapistProfileOut


DEMO_THERAPISTS = [
    {
        "email": "therapist1.demo@auticare.internal",
        "name": "Dr. Priya Sharma (Demo)",
        "phone": "+91 98222 33445",
        "title": "Senior Pediatric Behavioral Specialist",
        "qualification": "Ph.D. in Child Development, BCBA Certified",
        "experience_years": 8,
        "specializations": ["Child Behavior", "Developmental Therapy", "Speech Integration", "Sensory Processing", "ABA Therapy"],
        "languages": ["English", "Hindi"],
        "bio": "Certified specialist in early autism screening and personalized ABA-integrated behavioral interventions for young children. (Demo Specialist Profile)",
        "rating": 4.9,
        "reviews_count": 42,
        "hourly_rate": 1500,
        "location": "New Delhi Clinic & Tele-Therapy",
        "avatar_url": "https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150&auto=format&fit=crop&q=80",
    },
    {
        "email": "therapist2.demo@auticare.internal",
        "name": "Dr. Rajesh Kumar (Demo)",
        "phone": "+91 97333 44556",
        "title": "Occupational & Sensory Pathologist",
        "qualification": "M.Sc. Occupational Therapy, Sensory Integration Certified",
        "experience_years": 6,
        "specializations": ["Occupational Therapy", "Sensory Integration", "Motor Coordination"],
        "languages": ["English", "Hindi", "Marathi"],
        "bio": "Focuses on sensory processing, vestibular regulation, fine motor skills, and functional daily living adaptations. (Demo Specialist Profile)",
        "rating": 4.8,
        "reviews_count": 31,
        "hourly_rate": 1400,
        "location": "Mumbai Clinic & Tele-Therapy",
        "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    },
    {
        "email": "therapist3.demo@auticare.internal",
        "name": "Dr. Ananya Sen (Demo)",
        "phone": "+91 96444 55667",
        "title": "Speech & Language Pathologist",
        "qualification": "MASLP, Certified Pediatric Speech Therapist",
        "experience_years": 10,
        "specializations": ["Speech & Language Therapy", "Speech Integration", "Augmentative Communication (AAC)"],
        "languages": ["English", "Bengali", "Hindi"],
        "bio": "Dedicated to expressive communication, social narrative comprehension, and assistive AAC device coaching. (Demo Specialist Profile)",
        "rating": 4.95,
        "reviews_count": 56,
        "hourly_rate": 1600,
        "location": "Bengaluru Clinic & Tele-Therapy",
        "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    },
]

STANDARD_SLOTS = [
    ("09:00 AM", "09:30 AM"),
    ("09:30 AM", "10:00 AM"),
    ("10:00 AM", "10:30 AM"),
    ("10:30 AM", "11:00 AM"),
    ("11:00 AM", "11:30 AM"),
    ("11:30 AM", "12:00 PM"),
    ("02:00 PM", "02:30 PM"),
    ("02:30 PM", "03:00 PM"),
    ("03:00 PM", "03:30 PM"),
    ("03:30 PM", "04:00 PM"),
    ("04:00 PM", "04:30 PM"),
]


class TherapistService:
    @staticmethod
    def ensure_demo_therapists(db: Session) -> None:
        """Seed demo clinical specialists if none exist yet. Clearly marked as DEMO."""
        existing = db.query(User).filter(User.role == "THERAPIST").first()
        if existing:
            return

        for demo in DEMO_THERAPISTS:
            user = User(
                email=demo["email"],
                password_hash=get_password_hash("demo-therapist-pwd-12345"),
                name=demo["name"],
                role="THERAPIST",
                phone=demo["phone"],
                status="APPROVED",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = TherapistProfile(
                user_id=user.id,
                title=demo["title"],
                qualification=demo["qualification"],
                experience_years=demo["experience_years"],
                specializations=demo["specializations"],
                languages=demo["languages"],
                bio=demo["bio"],
                rating=demo["rating"],
                reviews_count=demo["reviews_count"],
                hourly_rate=demo["hourly_rate"],
                location=demo["location"],
                documents_verified=True,
                avatar_url=demo["avatar_url"],
            )
            db.add(profile)
            db.commit()

            # Add sample availability slots across weekdays
            for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
                for start_t, end_t in STANDARD_SLOTS:
                    slot = TherapistAvailability(
                        therapist_id=user.id,
                        day_of_week=day,
                        start_time=start_t,
                        end_time=end_t,
                        is_booked=False,
                    )
                    db.add(slot)
            db.commit()

    @staticmethod
    def list_therapists(
        db: Session, status_filter: Optional[str] = None
    ) -> List[TherapistProfileOut]:
        TherapistService.ensure_demo_therapists(db)

        query = db.query(User).filter(User.role == "THERAPIST")
        if status_filter:
            query = query.filter(User.status == status_filter)

        users = query.all()
        results: List[TherapistProfileOut] = []
        for user in users:
            profile = (
                db.query(TherapistProfile)
                .filter(TherapistProfile.user_id == user.id)
                .first()
            )
            joined_date = user.created_at.strftime("%Y-%m-%d") if user.created_at else "2026-01-01"

            if profile:
                results.append(
                    TherapistProfileOut(
                        id=str(user.id),
                        email=user.email,
                        name=user.name,
                        role="THERAPIST",
                        phone=user.phone or "",
                        status=user.status or "APPROVED",
                        joinedDate=joined_date,
                        avatarUrl=profile.avatar_url,
                        title=profile.title,
                        qualification=profile.qualification,
                        experienceYears=profile.experience_years,
                        specializations=profile.specializations or [],
                        languages=profile.languages or [],
                        bio=profile.bio or "",
                        rating=profile.rating,
                        reviewsCount=profile.reviews_count,
                        hourlyRate=profile.hourly_rate,
                        location=profile.location,
                        documentsVerified=profile.documents_verified,
                    )
                )
            else:
                results.append(
                    TherapistProfileOut(
                        id=str(user.id),
                        email=user.email,
                        name=user.name,
                        role="THERAPIST",
                        phone=user.phone or "",
                        status=user.status or "APPROVED",
                        joinedDate=joined_date,
                        avatarUrl=None,
                        title="Clinical Specialist",
                        qualification="Certified Clinician",
                        experienceYears=3,
                        specializations=["Child Behavior", "Developmental Therapy"],
                        languages=["English"],
                        bio="",
                        rating=4.8,
                        reviewsCount=0,
                        hourlyRate=1500,
                        location="Online & In-Clinic",
                        documentsVerified=True,
                    )
                )
        return results

    @staticmethod
    def get_therapist_by_id(db: Session, therapist_id: int) -> Optional[TherapistProfileOut]:
        TherapistService.ensure_demo_therapists(db)

        user = db.query(User).filter(User.id == therapist_id, User.role == "THERAPIST").first()
        if not user:
            return None

        profile = (
            db.query(TherapistProfile)
            .filter(TherapistProfile.user_id == user.id)
            .first()
        )
        joined_date = user.created_at.strftime("%Y-%m-%d") if user.created_at else "2026-01-01"

        return TherapistProfileOut(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role="THERAPIST",
            phone=user.phone or "",
            status=user.status or "APPROVED",
            joinedDate=joined_date,
            avatarUrl=profile.avatar_url if profile else None,
            title=profile.title if profile else "Clinical Specialist",
            qualification=profile.qualification if profile else "Certified Clinician",
            experienceYears=profile.experience_years if profile else 3,
            specializations=profile.specializations if profile else ["Child Behavior"],
            languages=profile.languages if profile else ["English"],
            bio=profile.bio if profile else "",
            rating=profile.rating if profile else 4.8,
            reviewsCount=profile.reviews_count if profile else 0,
            hourlyRate=profile.hourly_rate if profile else 1500,
            location=profile.location if profile else "Online & In-Clinic",
            documentsVerified=profile.documents_verified if profile else True,
        )

    @staticmethod
    def update_therapist_status(db: Session, therapist_id: int, new_status: str) -> TherapistProfileOut:
        user = db.query(User).filter(User.id == therapist_id, User.role == "THERAPIST").first()
        if not user:
            raise ValueError("Therapist not found")

        user.status = new_status
        db.commit()
        db.refresh(user)

        return TherapistService.get_therapist_by_id(db, therapist_id)

    @staticmethod
    def get_availability(db: Session, therapist_id: int) -> List[AvailabilitySlotOut]:
        TherapistService.ensure_demo_therapists(db)

        slots = (
            db.query(TherapistAvailability)
            .filter(TherapistAvailability.therapist_id == therapist_id)
            .all()
        )
        return [
            AvailabilitySlotOut(
                id=str(slot.id),
                therapistId=str(slot.therapist_id),
                dayOfWeek=slot.day_of_week,
                startTime=slot.start_time,
                endTime=slot.end_time,
                isBooked=slot.is_booked,
            )
            for slot in slots
        ]
