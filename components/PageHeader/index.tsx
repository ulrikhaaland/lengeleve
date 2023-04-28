import React, { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { User } from "@/stores/general.store";
import { useStore } from "../../stores/RootStoreProvider";

const PageHeader = () => {
  const { generalStore } = useStore();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User>(generalStore.user);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e: any) => {
    setUser({
      ...user,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log(user);
    setOpen(false);
    localStorage.setItem("user", JSON.stringify(user));
  };

  useEffect(() => {
    generalStore.setUser(user);
  }, [generalStore, user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="border-b w-full">
      <div className="grid grid-cols-3 items-center">
        <div></div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mt-4 mb-2">ChatLongevity</h2>
          <h2 className="text-m mb-2 text-gray-600">Model: Chattia01</h2>
        </div>
        <div className="text-right mr-4">
          <IconButton color="inherit" onClick={handleClickOpen}>
            <AccountCircleIcon />
          </IconButton>
        </div>
      </div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">User Information</DialogTitle>
        <DialogContent>
          <form className="space-y-4">
            <div className="flex flex-col">
              <label
                htmlFor="age-group"
                className="text-sm font-medium text-gray-700"
              >
                Age Group
              </label>
              <select
                onChange={handleChange}
                id="ageGroup"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.ageGroup || ""}
              >
                <option>Select age group</option>
                <option>18-24</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45-54</option>
                <option>55-64</option>
                <option>65+</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                onChange={handleChange}
                id="gender"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.gender || ""}
              >
                <option>Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="activityLevel"
                className="text-sm font-medium text-gray-700"
              >
                Activity Level
              </label>
              <select
                onChange={handleChange}
                id="activityLevel"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.activityLevel || ""}
              >
                <option>Select activity level</option>
                <option>Sedentary</option>
                <option>Lightly active</option>
                <option>Moderately active</option>
                <option>Very active</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="dietary-preferences"
                className="text-sm font-medium text-gray-700"
              >
                Dietary Preferences
              </label>
              <select
                onChange={handleChange}
                id="dietaryPreferences"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.dietaryPreferences || ""}
              >
                <option>Select dietary preference</option>
                <option>Standard</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>Gluten-free</option>
                <option>Ketogenic</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="health-goals"
                className="text-sm font-medium text-gray-700"
              >
                General Health Goals
              </label>
              <select
                onChange={handleChange}
                id="healthGoals"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.healthGoals || ""}
              >
                <option>Select health goal</option>
                <option>Weight loss</option>
                <option>Muscle gain</option>
                <option>General wellness</option>
                <option>Improve fitness</option>
                <option>Stress management</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="allergies"
                className="text-sm font-medium text-gray-700"
              >
                Allergies or Intolerances (optional)
              </label>
              <input
                onChange={handleChange}
                type="text"
                id="allergies"
                placeholder="e.g. lactose, peanuts"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.allergies || ""}
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="sleepHabits"
                className="text-sm font-medium text-gray-700"
              >
                Typical Sleep Duration
              </label>
              <input
                onChange={handleChange}
                type="text"
                id="sleepHabits"
                placeholder="e.g. 7 hours"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.sleepHabits || ""}
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="stress-levels"
                className="text-sm font-medium text-gray-700"
              >
                Stress Levels
              </label>
              <select
                onChange={handleChange}
                id="stressLevels"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.stressLevels || ""}
              >
                <option>Select stress level</option>
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="time-availability"
                className="text-sm font-medium text-gray-700"
              >
                Time Availability for Exercise and Meal Prep
              </label>
              <input
                onChange={handleChange}
                type="text"
                id="timeAvailability"
                placeholder="e.g. 1 hour per day"
                className="rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base outline-none text-gray-700 py-1 px-3"
                value={user.timeAvailability || ""}
              />
            </div>
          </form>{" "}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
          <Button type="submit" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PageHeader;
