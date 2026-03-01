import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# CPU threading optimization
tf.config.threading.set_intra_op_parallelism_threads(0)  # 0 = use all cores
tf.config.threading.set_inter_op_parallelism_threads(0)

def build_model(seq_len, num_classes=6):
    inputs = keras.Input(shape=(seq_len, 3))
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True))(inputs)
    x = layers.Bidirectional(layers.LSTM(128))(x)
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Activation("linear", dtype="float32")(x)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32")(x)
    return keras.Model(inputs, outputs)


def make_dataset(X, y, batch_size, shuffle=False):
    ds = tf.data.Dataset.from_tensor_slices((X, y))
    if shuffle:
        ds = ds.shuffle(buffer_size=2048, reshuffle_each_iteration=True)
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)


def train_model(X, y, epochs=50, batch_size=256, lr=1e-3, val_split=0.2):
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)
    print(f"Label mapping: { {int(orig): enc for enc, orig in enumerate(encoder.classes_)} }")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y_encoded, test_size=val_split, random_state=42, stratify=y_encoded
    )

    class_counts = np.bincount(y_encoded)
    total = len(y_encoded)
    class_weight = {i: float(total / (len(class_counts) * c)) for i, c in enumerate(class_counts)}
    print(f"Class weights: {class_weight}")

    train_ds = make_dataset(X_train, y_train, batch_size, shuffle=True)
    val_ds   = make_dataset(X_val,   y_val,   batch_size, shuffle=False)

    model = build_model(seq_len=X.shape[1])
    model.compile(
        optimizer=keras.optimizers.Adam(lr),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    model.summary()

    callbacks = [
        keras.callbacks.ModelCheckpoint(
            "fog_6class_lstm.keras", monitor="val_loss",
            save_best_only=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=5, verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=15,
            restore_best_weights=True, verbose=1
        ),
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1
    )

    print("\nTraining complete. Best model saved to fog_6class_lstm.keras")
    return model, encoder, history

def predict(model, encoder, X):
    logits = model.predict(X)
    predicted_indices = np.argmax(logits, axis=1)
    return encoder.inverse_transform(predicted_indices)

if __name__ == "__main__":
    import json
    import pandas as pd
    print("Loading data...")

    df = pd.read_csv(".\\train_windows_augmented.csv")

    X = np.stack(
        df["imu_features"].apply(lambda x: np.array(json.loads(x), dtype=np.float32)).values
    )
    y = df["target_activity"].values.astype(np.int32)
    print("X shape:", X.shape)
    print("y shape:", y.shape)
    model, encoder, history = train_model(
        X, y,
        epochs=50,
        batch_size=256,
        lr=1e-3,
        val_split=0.2
    )
    print("Model training complete!")
