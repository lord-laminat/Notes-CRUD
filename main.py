from os import getenv
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload
from database import engine, get_db
import uvicorn

import models
import schemas


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Вспомогательные функции
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не удалось проверить учетные данные")
        return username
    except:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не удалось проверить учетные данные")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = decode_token(token)
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не удалось проверить учетные данные")
    return user

# Эндпоинты аутентификации
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверное имя пользователя или пароль")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Эндпоинты для досок
@app.post("/boards/", response_model=schemas.Board)
def create_board(board: schemas.BoardCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_board = models.Board(title=board.title, user_id=current_user.id)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

@app.get("/boards/", response_model=List[schemas.Board])
def read_boards(current_user: models.User = Depends(get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    boards = db.query(models.Board).filter(models.Board.user_id == current_user.id).options(joinedload(models.Board.tasks)).offset(skip).limit(limit).all()
    return boards

@app.get("/boards/{board_id}", response_model=schemas.Board)
def read_board(board_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = db.query(models.Board).filter(models.Board.id == board_id, models.Board.user_id == current_user.id).options(joinedload(models.Board.tasks)).first()
    if board is None:
        raise HTTPException(status_code=404, detail="Доска не найдена или доступ запрещён")
    return board

@app.put("/boards/{board_id}", response_model=schemas.Board)
def update_board(board_id: int, board: schemas.BoardCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_board = db.query(models.Board).filter(models.Board.id == board_id, models.Board.user_id == current_user.id).first()
    if db_board is None:
        raise HTTPException(status_code=404, detail="Доска не найдена или доступ запрещён")
    db_board.title = board.title
    db.commit()
    db.refresh(db_board)
    return db_board

@app.delete("/boards/{board_id}", response_model=schemas.Board)
def delete_board(board_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_board = db.query(models.Board).filter(models.Board.id == board_id, models.Board.user_id == current_user.id).first()
    if db_board is None:
        raise HTTPException(status_code=404, detail="Доска не найдена или доступ запрещён")
    db.delete(db_board)
    db.commit()
    return db_board

# Эндпоинты для задач
@app.post("/boards/{board_id}/tasks/", response_model=schemas.Task)
def create_task_for_board(board_id: int, task: schemas.TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = db.query(models.Board).filter(models.Board.id == board_id, models.Board.user_id == current_user.id).first()
    if board is None:
        raise HTTPException(status_code=404, detail="Доска не найдена или доступ запрещён")
    db_task = models.Task(**task.dict(), board_id=board_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/boards/{board_id}/tasks/", response_model=List[schemas.Task])
def read_tasks_for_board(board_id: int, current_user: models.User = Depends(get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    board = db.query(models.Board).filter(models.Board.id == board_id, models.Board.user_id == current_user.id).first()
    if board is None:
        raise HTTPException(status_code=404, detail="Доска не найдена или доступ запрещён")
    tasks = db.query(models.Task).filter(models.Task.board_id == board_id).offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).join(models.Board).filter(models.Task.id == task_id, models.Board.user_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Задача не найдена или доступ запрещён")
    return task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(models.Task).join(models.Board).filter(models.Task.id == task_id, models.Board.user_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Задача не найдена или доступ запрещён")
    db_task.title = task.title
    db_task.content = task.content
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}", response_model=schemas.Task)
def delete_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(models.Task).join(models.Board).filter(models.Task.id == task_id, models.Board.user_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Задача не найдена или доступ запрещён")
    db.delete(db_task)
    db.commit()
    return db_task


if __name__ == "__main__":
    uvicorn.run(app=app, host="127.0.0.1", port=8000)