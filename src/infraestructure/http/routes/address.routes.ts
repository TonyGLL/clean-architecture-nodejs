import { Router } from "express";
import { AddressController } from "../controllers/address.ctrl";
import { createAddressValidator, updateAddressValidator, addressIdValidator, setDefaultAddressValidator } from "../validators/address.validator";
import { expressValidatorErrors } from "../middlewares/validator.middleware"
import { container } from "../../ioc/config";

const router = Router();
const controller = container.get<AddressController>(AddressController);

router
    .get("/", expressValidatorErrors, controller.getAddressByClientId)
    .post("/", createAddressValidator, expressValidatorErrors, controller.createAddress)
    .get("/:id", addressIdValidator, expressValidatorErrors, controller.getAddressById)
    .put("/:id", updateAddressValidator, expressValidatorErrors, controller.updateAddress)
    .delete("/:id", addressIdValidator, expressValidatorErrors, controller.deleteAddress)
    .patch("/default/:id", setDefaultAddressValidator, expressValidatorErrors, controller.setDefaultAddress);

export default router;