from fastapi import APIRouter, Depends
from sqlmodel import Session
from db.session import get_session
from db.models import User, Baseline

router = APIRouter()

@router.post("/users")
def create_user(payload: dict, session: Session = Depends(get_session)):
    print("got called")
    user = User(display_name=payload["display_name"])
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"user_id": user.id}

@router.post("/users/{user_id}/baseline")
def save_baseline(user_id: int, payload: dict, session: Session = Depends(get_session)):
    baseline = Baseline(user_id=user_id, **payload)
    session.add(baseline)
    session.commit()
    return {"status": "baseline_saved"}
    